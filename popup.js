const count = document.querySelector(".ac_count");
const note = document.querySelector(".note");
const refreshBtn = document.querySelector(".refresh_btn");
const threadList = document.querySelector(".thread");
const wordCount = document.querySelector(".word_count");
const urlField = document.querySelector(".url_field");
const writeField = document.querySelector(".write_field");
const writeBtn = document.querySelector(".write_btn");
const size = 10;
let page = 0;

start();
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  if (obj.tag === "front_note") {
    note.innerText = obj.note;
  } else if (obj.tag === "front_count") {
    count.innerText = obj.count === "add" ? ++count.innerText : obj.count;
  } else if (obj.tag === "front_thread") {
    let li = document.createElement("li");
    threadList.appendChild(addItem(obj, li));
    threadList.scrollTop = threadList.scrollHeight;
  } else if (obj.tag === "front_more") {
    let li = document.createElement("li");
    threadList.prepend(addItem(obj, li));
  }
  response({ status: "ok" });
});

threadList.addEventListener("scroll", function () {
  if (threadList.scrollTop === 0) {
    ++page;
    chrome.runtime.sendMessage({ tag: "more", page: page, size: size });
  }
});

refreshBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  page = 0;
  threadList.innerHTML = "";
  start();
});

writeField.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    writeBtn.click();
  }
});

writeField.addEventListener("input", (e) => {
  const target = e.currentTarget;
  const currentLength = target.value.length;
  wordCount.innerText = `${currentLength}/127`;
});

writeBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const url = urlField.value;
  const content = writeField.value;

  if (url !== null && url !== "" && !isValidUrl(url)) {
    alert("Enter a valid Url");
    return;
  }

  if (content == null || content == "") {
    alert("A message is required");
    return;
  }

  const obj = {
    tag: "back_thread",
    msg: content,
    url: url ? url : "",
    date: new Date().toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }),
    utc: Date.now(),
  };
  chrome.runtime.sendMessage(obj, () => {});
  urlField.value = null;
  writeField.value = null;
  wordCount.innerText = "0/127";
});

function isValidUrl(urlString) {
  const urlPattern = /^(https?):\/\/(www\.)?(\w+)(\.\w+)/;
  return urlPattern.test(urlString);
}

function addItem(data, li) {
  if (data.msg) {
    li.innerHTML = data.url
      ? `<li>
        <label class="thread_date">${data.date}</label>
        <a href="${data.url}" target="_blank"
        ><label class="thread_url">${data.url}</label></a>
        <label class="thread_content">${data.msg}</label>
        <hr />
      </li>`
      : `<li>
        <label class="thread_date">${data.date}</label>
        <label class="thread_content">${data.msg}</label>
        <hr />
      </li>`;
    return li;
  }
}

function start() {
  chrome.runtime.sendMessage({ tag: "opened", page: page, size: size });
}
