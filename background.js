try {
  const endpoint = "https://www.plurg.me/api/v1";
  chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
    if (obj.tag === "back_thread") {
      await postTrends(obj);
    } else if (obj.tag === "opened") {
      await getNote();
      await getTrends(obj.page, obj.size, obj.tag);
    } else if (obj.tag === "more") {
      await getTrends(obj.page, obj.size, obj.tag);
    }
    response({ status: "ok" });
  });

  async function getNote() {
    console.log("Note");
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
      .then((data) => {
        console.log(data);
        const countObj = {
          tag: "front_count",
          count: data.totalElements,
        };
        sendToFront(countObj);
        data = data.content;
        data.forEach((item) => {
          item.tag = tag === "more" ? "front_more" : "front_thread";
          sendToFront(item);
        });
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
        data.tag = "front_thread";
        sendToFront(data);
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
