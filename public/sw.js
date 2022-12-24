importScripts("/static/js/dexie.js");
importScripts("/static/js/db.js");

let CACHE_VERSION = 1.32;

let CURRENT_CACHE = {
  static: `static-cache-v${CACHE_VERSION}`,
  dynamic: `dynamic-cache-v${CACHE_VERSION}`,
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CURRENT_CACHE["static"]).then((cache) => {
      cache.addAll([
        "/",
        "/offline.html",
        "/static/js/dexie.js",
        "/static/js/db.js",
        "/static/js/materialize.min.js",
        "/static/css/materialize.min.css",
        "/static/css/style.css",
        "/manifest.json",
        "/static/js/app.js",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  let expectedCacheNames = Object.values(CURRENT_CACHE);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.forEach((cacheName) => {
          if (!expectedCacheNames.includes(cacheName)) {
            console.log("deleting cache->", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

//*********************************************************************************************************
// self.addEventListener("fetch", (event) => {
//   console.log("fetch ->", event);
//   event.respondWith(
//     caches.open(CURRENT_CACHE['static']).then((cache) => {
//       return cache.match(event.request).then((response) => {
//         // return response || fetch(event.request);

//         if (response) {
//           console.log("Found the cache");
//           return response;
//         }

//         console.log("Fetching Request from the Network");

//         return fetch(event.request)
//           .then((networkResponse) => {
//             cache.put(event.request, networkResponse.clone());

//             return networkResponse;
//           })
//           .catch((err) => {
//             console.log("error in fetching data occured", err);
//             throw err;
//           });
//       });
//     })
//   );
// });
//*********************************************************************************************************
//cache event
self.addEventListener("fetch", (event) => {
  let urls = ["https://jsonplaceholder.typicode.com/posts"];

  if (urls.indexOf(event.request.url) > -1) {
    return event.respondWith(
      fetch(event.request).then((response) => {
        let cloneResponse = response.clone();

        cloneResponse.json().then((res) => {
          res.forEach((item) => db.products.put(item));
        });

        return response;

        // if (response) {
        //   return caches.open(CURRENT_CACHE["dynamic"]).then((cache) => {
        //     cache.put(event.request, response.clone());

        //     return response;
        //   });
        // }
      })
      // .catch((err) => {
      //   console.log("err->", err);
      //   return caches.match(event.request);
      // })
    );
  } else {
    return event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;

        return fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CURRENT_CACHE["dynamic"]).then((cache) => {
              cache.put(event.request, networkResponse.clone());

              return networkResponse;
            });
          })
          .catch((err) => {
            console.log("show offline page", err);
            return caches.open(CURRENT_CACHE["static"]).then((cache) => {
              return cache.match("/offline.html");
            });
          });
      })
    );
  }
});

//background-sync event
self.addEventListener("sync", function (event) {
  console.log("background syncing ->", event);

  if (event.tag == "sync-new-product") {
    event.waitUntil(
      db.syncProducts.toArray().then((syncedProducts) => {
        syncedProducts.forEach((item) => {
          let fd = new FormData();
          fd.append("title", item.title);
          fd.append("body", item.body);
          fd.append("image", item.image, Date.now() + ".png");
          fd.append("price", item.price);

          fetch("", {
            method: "POST",
            body: fd,
          })
            .then((res) => res.json())
            .then((res) => {
              console.log("task synced successfully", res);

              if (res.status == "success") {
                db.syncProducts
                  .where({ title: item.title })
                  .delete()
                  .then(() => console.log("item deleted after being sent"));
              }
            })
            .catch((err) => console.log("err for synced product", err));
        });
      })
    );
  }
});

//notificationclick event
self.addEventListener("notificationclick", (event) => {
  let notification = event.notification;
  // console.log("=>", event.action, notification.data);
  notification.close();

  switch (event.action) {
    case "download-action":
      promiseCahin = clients.openWindow(notification.data.url1);
      break;
    case "show-action":
      promiseCahin = clients.openWindow(notification.data.url3);
      break;
    default:
      promiseCahin = clients.openWindow(notification.data.url2);
      break;
  }

  event.waitUntil(promiseCahin);
});

//event push
self.addEventListener("push", (event) => {
  const DEFAULT_TAG = "sample-notification";

  const data = event.data.json();

  const title = data.notification.title;
  const options = data.notification;

  if (!options.tag) {
    options.tag = DEFAULT_TAG;
  }

  event.waitUntil(registration.showNotification(title, options));
});
