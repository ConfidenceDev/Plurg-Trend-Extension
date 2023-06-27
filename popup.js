const count = document.querySelector(".ac_count");
const note = document.querySelector(".note");
const refreshBtn = document.querySelector(".refresh_btn");
const threadList = document.querySelector(".thread");
const wordCount = document.querySelector(".word_count");
const urlField = document.querySelector(".url_field");
const writeField = document.querySelector(".write_field");
const writeBtn = document.querySelector(".write_btn");
const settingsBtn = document.querySelector(".settings");
const avatars = document.querySelector(".avatars");
const midMenu = document.querySelector(".mid_menu");
const usernameField = document.querySelector(".username");
const sessionEl = document.querySelector(".session");

const size = 10;
let page = 0;
let isRefresh = false;
let isHome = true;
let avatar = "mood_1.png";
let username = "Anonymous";
let session = Date.now().toString();

start();
chrome.runtime.onMessage.addListener((obj, sender, response) => {
  if (obj.tag === "store") {
    loadMenu(obj);
  } else if (obj.tag === "front_note") {
    note.innerText = obj.note;
    isRefresh = false;
  } else if (obj.tag === "front_count") {
    count.innerText =
      obj.count === "add"
        ? ++count.innerText
        : obj.count === "delete"
        ? --count.innerText
        : obj.count;
  } else if (obj.tag === "me_thread") {
    threadList.append(addItem(obj));
    threadList.scrollTop = threadList.scrollHeight;
  } else if (obj.tag === "front_thread") {
    threadList.prepend(addItem(obj));
    threadList.scrollTop = threadList.scrollHeight;
  } else if (obj.tag === "front_more") {
    threadList.prepend(addItem(obj));
  } else if (obj.tag === "front_delete") {
    const liDel = threadList.querySelector(`li[data-id="${obj.id}"]`);
    if (liDel) threadList.removeChild(liDel);
  }
  response({ status: "ok" });
});

settingsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (isHome) {
    settingsBtn.src = "./icons/close.png";
    threadList.style.display = "none";
    midMenu.style.display = "flex";
    loadStore();
    isHome = false;
  } else {
    settingsBtn.src = "./icons/menu.png";
    midMenu.style.display = "none";
    threadList.style.display = "flex";
    saveStore(session);
    isHome = true;
  }
});

function loadMenu(obj) {
  if (obj.session !== -1) {
    avatar = obj.avatar;
    username = obj.username;
    session = obj.session === -1 ? session : obj.session;
  }

  if (obj.session === -1) saveStore(session);

  usernameField.value = username;
  sessionEl.innerText = session;
  for (let i = 0; i < avatars.children.length; i++) {
    if (
      avatars.children[i].children[0].getAttribute("src") ===
      `icons/avatars/${avatar}`
    ) {
      avatars.children[i].children[0].classList.add("av_sel");
    }
  }
}

function loadStore() {
  chrome.runtime.sendMessage({ tag: "load" }, () => {});
}

function saveStore(sVal) {
  const obj = {
    tag: "store",
    avatar: avatar,
    username: username,
    session: sVal,
  };
  chrome.runtime.sendMessage(obj, () => {});
}

avatars.addEventListener("click", (e) => {
  e.preventDefault();

  for (let i = 0; i < avatars.children.length; i++) {
    avatars.children[i].children[0].classList.remove("av_sel");
  }

  e.target.classList.add("av_sel");
  avatar = e.target.getAttribute("src").split("/")[2];
});

usernameField.addEventListener("blur", (e) => {
  e.preventDefault();
  username = usernameField.value;
});

threadList.addEventListener("scroll", () => {
  if (
    threadList.scrollTop === 0 &&
    threadList.children.length < count.innerText &&
    !isRefresh
  ) {
    ++page;
    chrome.runtime.sendMessage({ tag: "more", page: page, size: size });
  }
});

refreshBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  threadList.replaceChildren();
  isRefresh = true;
  page = 0;
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
    avatar: avatar,
    username: username,
    session: session,
    date: new Date().toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }),
    utc: Date.now(),
  };
  chrome.runtime.sendMessage(obj, () => {});
  urlField.value = null;
  writeField.value = null;
  wordCount.innerText = "0/127";
});

function addItem(data) {
  const li = document.createElement("li");
  li.setAttribute("data-id", data.id);
  li.innerHTML = `<div class="li_cover">
          <img src="./icons/avatars/${data.avatar}" />
          <div class="li_content">
            <label class="thread_username">${data.username}</label>
            <label class="thread_date">${data.date}</label>
            ${
              data.url
                ? `<a href="${data.url}" target="_blank">
                    <label class="thread_url">${data.url}</label></a>`
                : ""
            }
                  <label class="thread_content">${data.msg}</label>
            ${
              session === data.session
                ? `<button class="thread_delete" onclick="deleteItem(this)">delete</button>`
                : ""
            }
          </div>
        </div>
        <hr />`;

  const button = li.querySelector("button");
  if (button !== null) {
    button.addEventListener("click", deleteItem);

    function deleteItem(e) {
      e.preventDefault();
      chrome.runtime.sendMessage({ tag: "delete", id: data.id });
    }
  }
  return li;
}

function start() {
  chrome.runtime.sendMessage({ tag: "opened", page: page, size: size });
}

function isValidUrl(urlString) {
  const urlPattern = /^(https?):\/\/(www\.)?(\w+)(\.\w+)/;
  return urlPattern.test(urlString);
}
