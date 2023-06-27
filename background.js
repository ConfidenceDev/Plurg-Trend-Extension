try {
  const endpoint = "https://plurg-trend.onrender.com/api/v1";
  const store = "store";

  chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
    if (obj.tag === "back_thread") {
      await postTrends(obj);
    } else if (obj.tag === "opened") {
      loadStore();
      await getNote();
      await getTrends(obj.page, obj.size, obj.tag);
    } else if (obj.tag === "more") {
      await getTrends(obj.page, obj.size, obj.tag);
    } else if (obj.tag === "delete") {
      await deleteTrend(obj);
    } else if (obj.tag === "store") {
      chrome.storage.local.set({ [store]: obj });
    } else if (obj.tag === "load") {
      loadStore();
    }
    response({ status: "ok" });
  });

  function loadStore() {
    chrome.storage.local.get(store, (result) => {
      let data = { ...result[store] };

      data =
        Object.keys(data).length !== 0
          ? data
          : {
              tag: "store",
              session: -1,
            };
      sendToFront(data);
    });
  }

  async function getNote() {
    fetch(`${endpoint}/note`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        data.tag = "front_note";
        sendToFront(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  async function getTrends(page, size, tag) {
    fetch(`${endpoint}/trends/${page}/${size}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((result) => {
        if (result !== null) {
          const countObj = {
            tag: "front_count",
            count: result.total,
          };
          sendToFront(countObj);
          result.data.forEach((item) => {
            item.tag = tag === "more" ? "front_more" : "front_thread";
            sendToFront(item);
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  async function postTrends(data) {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    fetch(`${endpoint}/trends`, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const countObj = {
          tag: "front_count",
          count: "add",
        };
        sendToFront(countObj);
        data.tag = "me_thread";
        sendToFront(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    return true;
  }

  async function deleteTrend(obj) {
    const requestOptions = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    };

    fetch(`${endpoint}/delete/${obj.id}`, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const countObj = {
          tag: "front_count",
          count: "delete",
        };
        sendToFront(countObj);
        const deleteItem = {
          tag: "front_delete",
          id: obj.id,
        };
        sendToFront(deleteItem);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function sendToFront(obj) {
    chrome.runtime.sendMessage(obj, () => {});
  }

  async function toComma(value) {
    return await value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
} catch (e) {
  console.error(e);
}
