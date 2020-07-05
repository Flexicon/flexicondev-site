window.addEventListener('load', () => {
  // Get and prepare element for typewriting
  const logoEl = document.getElementById('logo-text');
  logoEl.innerHTML = ''; // clear logo el - default text "hello world" to handle disabled js

  // Prepare typewriter
  const typewriter = new TypeIt('#logo-text', {
    speed: 75,
    cursor: false,
    loop: true,
  });

  // Type out each code snippet assigned to data attribute sequentially
  const snippets = shuffle(logoEl.dataset['values'].split(','));
  snippets.forEach((s) => {
    typewriter.type(s, { delay: 3000 }).delete(s.length, { delay: 200 });
  });

  // Start typing!
  typewriter.go();
});

function shuffle(array) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
