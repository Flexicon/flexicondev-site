---
title: 'Read Go HTTP Request body multiple times'
date: 2022-10-31
draft: false
summary: 'Or any other io.Reader in a reusable way'
tags: ['go', 'software-engineering']
---

I think we can all agree that writing HTTP servers in Go is an overall simple and pleasant affair. But what happens when we find ourselves needing to read the body of an incoming request multiple times? A common use case would be a middleware that needs to read and verify the request body before it can be processed further, or another that needs to log the request body while still allowing the body to be read later on.

## The Problem

After reading once from the `io.Reader` implemented by the body field of Go http requests, it becomes impossible to read from it again. There is also no builtin way to simply *"reset"* the body as part of the interface.

## The simplest solution

For the simplest solution, we simply need to make sure that every time we read through the request body, we read through it fully and then replace it with a new reader. Simple.

```go
body, err := io.ReadAll(r.Body)
// Replace the body with a new reader after reading from the original
r.Body = io.NopCloser(bytes.NewBuffer(body))
```

We can even make use of an `io.TeeReader` and `bytes.Buffer`.

```go
buf := bytes.Buffer{} // A Buffer is both a Reader and Writer
req.Body = io.TeeReader(req.Body, &buf)
// Do some body reading, then replace the body with the buffer
req.Body = &buf
```

## Simple Reusable Reader implementation

Because Go's interfaces work via [structural typing](https://en.wikipedia.org/wiki/Structural_type_system), we can very easily implement the `io.Reader` interface with a custom type as a drop-in replacement. Thus creating an `io.Reader` that can be *"read from"* an infinite number of times.

```go
type reusableReader struct {
	io.Reader
	readBuf *bytes.Buffer
	backBuf *bytes.Buffer
}

func ReusableReader(r io.Reader) io.Reader {
	readBuf := bytes.Buffer{}
	readBuf.ReadFrom(r) // error handling ignored for brevity
	backBuf := bytes.Buffer{}

	return reusableReader{
		io.TeeReader(&readBuf, &backBuf),
		&readBuf,
		&backBuf,
	}
}

func (r reusableReader) Read(p []byte) (int, error) {
	n, err := r.Reader.Read(p)
	if err == io.EOF {
		r.reset()
	}
	return n, err
}

func (r reusableReader) reset() {
	io.Copy(r.readBuf, r.backBuf) // nolint: errcheck
}
```

## Basic usage

A simple example of using our reusable reader with basically any `io.Reader` implementation.

```go
func main() {
	text := "Lorem ipsum dolor sit amet"
	r := ReusableReader(strings.NewReader(text))

	readAndPrint(r)
	readAndPrint(r)
	readAndPrint(r)
}

func readAndPrint(r io.Reader) {
	b, _ := io.ReadAll(r)
	fmt.Printf("%s\n", string(b))
}

// "Lorem ipsum dolor sit amet"
// "Lorem ipsum dolor sit amet"
// "Lorem ipsum dolor sit amet"
```

*Worth noting that if only dealing with `strings.Reader`s or `bytes.Reader`s, it is infinitely easier to simply seek back to the beginning of those readers since they implement the `io.Seeker` interface*

```go
r := strings.NewReader(text)
r.Seek(0, 0) // will effectively reset the reader back to the beginning
```

## Request body usage

Things get more complicated when dealing with `http.Request` body fields, which don't implement the `io.Seeker` interface. In that case, for any `http.Request` we can easily use our reusable reader in place of its `Body`.

```go
func handler(w http.ResponseWriter, r *http.Request) {
	r.Body = io.NopCloser(ReusableReader(r.Body))
	// Perform any reads however much we like from here on out
}
```

We needed to wrap our `ReusableReader` with an `io.NopCloser` in order to adhere to the `io.ReadCloser` interface. We could realistically simplify this case by implementing the `io.Closer` interface, just like the `io.NopCloser` does.

```go
func (r ReusableReader) Close() error { return nil }
```

Which would allow the above example to be a tad simpler.

```go
r.Body = ReusableReader(r.Body)
```

## A more real-world example

Infinitely re-reading a static byte reader isn't all that exciting. So let's assume that we are building a web application and have created the following middleware for our request handlers, which both require the reading of the request body.

```go
func logRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		msg := fmt.Sprintf("%s %s", r.Method, r.URL.Path)

		if body, _ := io.ReadAll(r.Body); len(body) > 0 {
			msg += fmt.Sprintf(" Body: %s", string(body))
		}

		log.Print(msg)
		next.ServeHTTP(w, r)
	})
}

func verifyRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		// Perform some request verification here
		if err != nil || len(body) == 0 {
			log.Printf("%d: Request verification failed", http.StatusBadRequest)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		log.Printf("Request verified: %s", string(body))
		next.ServeHTTP(w, r)
	})
}
```

If used as is, then whichever of these middleware that we would run second would not be able to read the request body, since it would have already been read from by the first. This is where our reusable reader can come in handy, and we could simply wrap it's logic around a third middleware that should be ran first in the chain.

```go
func reuseBody(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = io.NopCloser(ReusableReader(r.Body))
		next.ServeHTTP(w, r)
	})
}
```

Now that we have all middleware in place, we can setup our http server and make use of the infinitely readable `http.Request` body.

Let's assume we have a handler called `greet` which will greet the user based on the request body payload - again needing to read from the request body after passing it through both of the other middleware already.

```go
func main() {
	greetHandler := http.HandlerFunc(greet)

	mux := http.NewServeMux()
	mux.Handle("/greet", reuseBody(logRequest(verifyRequest(greetHandler))))

	fmt.Println("Listening on port http://localhost:9000/")
	log.Fatalln(http.ListenAndServe(":9000", mux))
}
```

## Final thoughts and drawbacks

While this is all fine and dandy with the simple examples above, it's important to remember that this reusable reader is by nature not a very efficient implementation of the `io.Reader` interface; mainly because we require reading all of the data up front into a buffer. Which won't work well for anything large like files or larger streams of data.

Another issue with this approach is that we are assuming that everyone attempting to read from the reader knows and assumes that it is an instance of a `ReusableReader`. At which point it might be better/safer for middleware to simply read from the reader, process any data and replace the reader with a new one like mentioned before.
