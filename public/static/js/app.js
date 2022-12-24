if ("serviceWorker" in navigator) {
  //   console.log("service-worker works");
  navigator.serviceWorker
    .register("/sw.js")
    .then((registeration) => {
      console.log("sw registeration succeded", registeration);
    })
    .catch((error) => {
      console.log("sw registeration failed", error);
    });
}

let installPromptEvent;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPromptEvent = e;
});

document.querySelector(".fixed-action-btn a").addEventListener("click", (e) => {
  e.preventDefault();
  console.log(installPromptEvent);

  if (installPromptEvent) {
    installPromptEvent.prompt();

    installPromptEvent.userChoice.then((choiceResult) => {
      console.log(choiceResult);
      if (choiceResult.outcome === "accepted") {
        console.log("user accepted");
      } else {
        console.log("user dismissed");
      }

      installPromptEvent = null;
    });
  }
});

fetch("https://jsonplaceholder.typicode.com/posts")
  .then((response) => response.json())
  .then((res) => {
    if (res?.length > 0) {
      console.log("--->", res.length);
      let products = res;

      products.forEach((item) => createProduct(item));
    }
  })
  .catch((err) => {
    if ("indexedDB" in window) {
      db.products.toArray().then((items) => {
        items.forEach((item) => createProduct(item));
      });
    }
  });

function createProduct(productItem) {
  let card = `
        <div class="col s12 m4">
          <div class="card">
            <div class="card-image">
              <img src="https://roocket.ir/public/image/2017/8/9/react-native.png">
              <span class="card-title">fake${Math.random()}</span>
            </div>
            <div class="card-content">
            <p>${productItem.title}</p>
            </div>
          </div>
        </div>
  `;

  let productsWrapper = document.getElementById("products");

  productsWrapper.innerHTML += card;
}
