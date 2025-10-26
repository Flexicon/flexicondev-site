---
title: 'Gophers on the Web: Getting Started with Go and WebAssembly'
date: 2024-04-17
draft: false
summary: 'A minimal, barebones, step-by-step guide on getting started with WebAssembly using the Go programming language.'
tags: ['go', 'javascript', 'webassembly', 'wasm']
---

Have you ever wanted to solve some specific problems in your web application, but JavaScript just wasn't spicy enough or you thought you could use _more processing power_?

Perhaps you're a fan of Web Development with Go and wanted to use it for more than just the backend?

Or maybe you've been hearing all the hubbub around [WebAssembly](https://webassembly.org/) (Wasm) and wanted to see what the big fuss was all about?

Well if you even remotely found yourself responding with an _"eh, I guess"_ to any of the above: look no further. On this page you'll find a minimal, barebones, step-by-step guide of what it takes to get a Go program compiled down to a Wasm module, running in your browser and interacting with it using a simple HTML form.

## What is WebAssembly?

To quote the [Official Website](https://webassembly.org/):

> WebAssembly (abbreviated Wasm) is a binary instruction format for a stack-based virtual machine. Wasm is designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications.

In the context of this post, you can think of it as a way for us to run code written in programming languages other than native web JavaScript in the browser.

## The Goal for today

Let's keep things simple here.

![Mockup of the square root calculator web page](https://cdn.hashnode.com/res/hashnode/image/upload/v1713083331209/e0e039ca-6fa5-49a1-b5e5-e4d9e1cc953a.png)

We'll build a basic web page with a single input form. The form will take a number from the user and when submitted will display its square root.

About as simple as can be, and straightforward to achieve in vanilla JavaScript. However we're complicated individuals and we don't want to use JavaScripts math or parsing features here - all input parsing and calculations will happen in a Wasm module written in Go instead.

## The Solution

Looking to jump straight into the solution? I respect your moxie. In that case [check out the Git repo](https://github.com/Flexicon/go-in-the-browser).  
The key files to check are `web/index.html` to see how the Wasm module is hooked up to our HTML, and the Go Wasm source code itself under `cmds/wasm/main.go`.

**🚨 Spoiler alert:** here's a [live version](https://go-in-the-browser.pages.dev/) of the finished web page.

Otherwise, keep on reading and we'll break down the solution step-by-step.

## A simple Wasm Module

The most minimal setup for a Go Wasm module doesn't differ in any way from a generic _"Hello, World"_ program.

```go
package main

import (
	"fmt"
)

func main() {
	fmt.Println("Go Wasm module instantiated!")
}
```

The secret sauce is all in how we _compile_ the code from here on out.

In a regular Go program, we might do something like `go build .` , but when targeting Wasm we must specify more arguments and variables.

```bash
GOARCH=wasm GOOS=js go build -o app.wasm .
```

The `GOOS` variable tells the compiler what operating system we want our target binary to run on, and the `GOARCH` variables tells it what architecture should be used for the binary. This is also the standard way for cross compiling Go programs, for example to target `darwin` for macOS and `arm64` for Apple silicon architecture.

## Running the Wasm in a browser

First things first, we'll need a bit of JavaScript to run and instantiate our Go-based Wasm module in the browser - luckily the standard library provides this with every installation of Go, we must simply copy it over to our working directory.

```bash
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
```

Now we have a `wasm_exec.js` file which we can load in our browser - great, let's do that now.

```xml
<script src="wasm_exec.js"></script>
```

We can add the above snippet to the head of any HTML document where we want to execute Wasm. Let's create a skeleton document now.

```xml
<!DOCTYPE html>
<html>
  <head>
    <title>Using Go in the Browser</title>
    <script src="wasm_exec.js"></script>
  </head>
  <body></body>
</html>
```

Okay, so we've copied the code that will execute our Wasm module and loaded it in our HTML. Now we have to actually tell the browser to fetch, instantiate and run our `app.wasm` module. Add the following script tag below the one which loads `wasm_exec.js` in the head of the document.

```xml
<script>
  // Creates an instance of the Go wasm_exec class,
  // streams in the Wasm module using fetch
  // and finally runs it. 🚀
  const go = new Go();
  WebAssembly.instantiateStreaming(fetch('app.wasm'), go.importObject).then((result) => {
    go.run(result.instance);
  });
</script>
```

Let's test this out and see it come together in action. You should now be able to serve your `index.html` file along with the `wasm_exec.js` and `app.wasm` files using any preferred method. I personally like using [gommand](https://github.com/sno6/gommand) for quick demos like this one.

```bash
go install github.com/sno6/gommand@latest
# Now serve assets in your current directory
gommand 'http.Handle("/", http.FileServer(http.Dir("."))); fmt.Println(http.ListenAndServe(":8080", nil))'
```

The snippet runs a simple Go HTTP File Server based on your current working directory. Once it's running navigate to your web page (if using `gommand` [http://localhost:8080/](http://localhost:8080/)) and check your console - you should see the following:

![Screenshot of Go Wasm module output in browser console](https://cdn.hashnode.com/res/hashnode/image/upload/v1713087758323/bfa664c3-44c2-4bca-8d1d-add97ed844f8.png)

🚀 Great success! Our Wasm module has been successfully loaded, and the standard output from our Go program has landed in our browser console.

## Adding the Form and some Spice 🌶️

Currently our web page is empty and our Wasm module doesn't really do much - nothing to write home about in any case. Let's fix that.

Here's the markup for our form:

```xml
<main>
  <form id="sqrt-form">
    <input type="text" name="sqrt-num" id="sqrt-num" placeholder="Enter some number" required />
    <button type="submit">Calculate Square Root</button>
  </form>
  <div id="sqrt-answer"></div>
</main>
```

Save it and refresh the page to see... a bit more, but still not that much.

![Screenshot of the square root calculator form](https://cdn.hashnode.com/res/hashnode/image/upload/v1713097630394/4eda1620-87f5-4766-bbe1-dcd0d63defa7.png)

Let's quickly _spice things up a notch_ by dropping in a little semantic CSS, courtesy of [Pico](https://picocss.com/) ✨

```xml
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.classless.violet.min.css" />
```

... and adding a tiny bit of style to the body tag:

```xml
<body style="max-width: 900px; margin: 0 auto">
```

And - channeling my inner [Emeril Lagasse](https://en.wikipedia.org/wiki/Emeril_Lagasse) - bam!

![Screenshot of styled square root calculator web page](https://cdn.hashnode.com/res/hashnode/image/upload/v1713098014381/5ae3831b-f204-40db-adef-37af3d1e84a3.png)

Nice - that's a little more presentable at least, and immediately matches our earlier mockup.

## Extending the Wasm Module

Now that we have our form set up and markup thoroughly spiced, we can move on back to the actual Wasm code. So far, all it does is print a message to standard output and exits. In order to be able to have it calculate square roots for us, we'll need to do a few things:

1. Export a function for the JavaScript runtime to call
2. Keep the Go program running and waiting for calls to said function

We can achieve #2 fairly easily by adding a blocking channel receiver call on a perpetually empty channel.

```go
func main() {
	fmt.Printf("Go Wasm module instantiated!\n")

	<-make(chan bool)
}
```

Cool. Now our program will actually wait around to receive calls. But what sort of calls is it listening for? Well at present: none. Let's change that.

```go
func main() {
	fmt.Printf("Go Wasm module instantiated!\n")

    // 1
	js.Global().Set("GoSqrt", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) < 1 { // 2
			return math.NaN() // 3
		}

		return math.Sqrt(parseFloatJS(args[0])) // 4
	}))

	<-make(chan bool)
}
```

Now let's unpack a bit what exactly is happening here:

1. We call the `syscall/js.Global` func, which allows us to use the standard library to interact with JavaScript's Global namespace (ie: the `window` object). In this particular case we `Set` (or declare) a new global function - named `GoSqrt` - which receives a reference to JavaScript's `this` scope for the function and a slice of `js.Value` arguments.
2. We then do some initial argument validation, since our newly declared function requires one argument to be passed to it - the number for which we want to find a square root.
3. If the function was called without any arguments, we return a [`NaN`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN).
4. If all is well, we call the standard library `math.Sqrt` func with the argument received from the browser after having parsed it.

Ah, I mentioned parsing. Well since JavaScript is not strongly typed, we can't really enforce what type of data gets passed to our function from the browser. What we _can_ do is _handle_ the types passed in Go, and in our case we can handle either a JavaScript `number` or `string` type. The `js.Value` struct provides some nice helpers to make this easier.

Here's how we do that:

```go
// parseFloatJS returns a float64 from a js.Value, based on either a `number` or `string` js type. NaN otherwise.
func parseFloatJS(v js.Value) float64 {
	switch v.Type() {
	case js.TypeNumber:
		return v.Float()
	case js.TypeString:
		if f, err := strconv.ParseFloat(v.String(), 64); err == nil {
			return f
		}
	}
	return math.NaN()
}
```

The logic is fairly basic. We essentially return a `float64` when the argument is a JavaScript `number` type, and if it is a `string` we use Go's standard `strconv` package to parse a `float64` out of it and return the result if all went well. In all other cases we return `NaN`.

## Wiring everything together

Phew, almost there. The last step is to wire it all up, with some standard DOM JavaScript. What we want to do here is listen to the form submit event, read the current value from our number input and pass it to our global `GoSqrt` function exported by our Wasm module. Finally we display the returned result from said function below our form.

So let's wrap this up by updating our script tag with the following:

```javascript
function wireItAllUp() {
  const sqrtNumInput = document.getElementById('sqrt-num');
  const sqrtForm = document.getElementById('sqrt-form');
  const sqrtAnswerDiv = document.getElementById('sqrt-answer');

  sqrtForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const value = sqrtNumInput.value;
    // This is the 👇 part where we call out to Wasm.
    const result = GoSqrt(value);

    sqrtAnswerDiv.innerHTML = `🤓 The square root of ${value} is ${result}.<br>So sayeth the Gopher.`;
  });
}

// This statement is unchanged apart from the wireItAllUp call.
WebAssembly.instantiateStreaming(fetch('app.wasm'), go.importObject).then((result) => {
  go.run(result.instance);
  wireItAllUp(); // 👈 This line is new.
});
```

Now if we save our changes (make sure to rebuild your `app.wasm` file after making any changes to it) and refresh the page, we should be able to finally use the form and calculate any and all square roots we could possibly want.

![Screenshot of Go calculating square roots in the browser](https://cdn.hashnode.com/res/hashnode/image/upload/v1713100835331/77ee4b42-3fe1-43e4-9e85-c8866d267a9f.png)

And there you have it - Go running in the browser and doing math. The possibilities from here are essentially endless.

Here's a link to [the complete project](https://github.com/Flexicon/go-in-the-browser) as well as a [live version](https://go-in-the-browser.pages.dev/) to play around with.

## What's Next?

To greatly reduce the size of your Wasm binary file, consider using [TinyGo](https://tinygo.org/) as your compiler. Also, explore more real-world uses for your Wasm module, like generating images or using third-party packages for heavy processing tasks. Stay tuned and follow the blog to get updates when new posts are published.

## Further Reading

- The official [Go WebAssembly docs](https://github.com/golang/go/wiki/WebAssembly) to start diving a little deeper on the topic.
- The [WebAssembly Docs](https://webassembly.org/) themselves.
- The growing [WebAssembly section of awesome-go](https://awesome-go.com/#webassembly) for neat libraries and tools in the ecosystem.
- The list of [awesome-wasm](https://github.com/mbasso/awesome-wasm) things in the community - not just using Go.
- [go-app.dev](https://go-app.dev/) - the up and coming package for building [PWA's (Progressive Web Apps)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) using Go and Wasm.
