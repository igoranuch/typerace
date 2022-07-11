import { showInputModal, showMessageModal } from "./views/modal.mjs";
import { appendRoomElement, removeRoomElement, updateNumberOfUsersInRoom } from "./views/room.mjs";
import { addClass, removeClass } from "./helpers/domHelper.mjs";
import { appendUserElement, changeReadyStatus, removeUserElement } from "./views/user.mjs";
import { getText } from "./api/api.mjs";

const username = sessionStorage.getItem("username");

const roomsPage = document.getElementById("rooms-page");
const gamePage = document.getElementById("game-page");
const createRoomButton = document.getElementById("add-room-btn");
const leaveRoomButton = document.getElementById("quit-room-btn");
const usersContainer = document.getElementById("users-wrapper");
const roomsContainer = document.getElementById("rooms-wrapper");
const roomNameTag = document.getElementById("room-name");
const readyButton = document.getElementById("ready-btn");
const startTimer = document.getElementById("timer");
const gameTimer = document.getElementById("game-timer");
const textContainer = document.getElementById("text-container");

if (!username) {
  window.location.replace("/login");
}

const socket = io("", { query: { username } });

const handleCommonUsernames = () => {
  roomsPage.style.display = "none";

  showMessageModal({
    message: "Username is already taken, choose another!",
    onClose: () => {
      sessionStorage.removeItem("username");
      window.location.replace("/login");
    },
  });
};

const updateRooms = (rooms) => {
  roomsContainer.innerHTML = "";
  rooms.forEach((room) => {
    if (!room.isFull && !room.timerStarted)
      appendRoomElement({
        name: room.name,
        numberOfUsers: room.numberOfUsers,
        onJoin: () => {
          joinRoom(room.name);
        },
      });
  });
};

const joinRoom = (roomName) => {
  socket.emit("JOIN_ROOM", roomName);
  addClass(roomsPage, "display-none");
  removeClass(gamePage, "display-none");
  roomNameTag.innerText = roomName;
};

const updateRoomUsers = (users) => {
  usersContainer.innerHTML = "";
  users.forEach((user) => {
    userJoinedRoom(user);
  });
};

const userLeftRoom = (username) => {
  removeUserElement(username);
};

const userJoinedRoom = (user) => {
  appendUserElement({
    username: user.name,
    ready: user.isReady,
    isCurrentUser: user.name === username,
  });
};

createRoomButton.addEventListener("click", () => {
  let roomName = "";

  showInputModal({
    title: "Enter room name",
    onChange: (value) => {
      roomName = value;
    },
    onSubmit: () => {
      if (roomName.trim() === "") {
        showMessageModal({ message: "Empty input!" });
        return;
      }
      socket.emit("CREATE_ROOM", roomName, (isActive) => {
        if (!isActive) {
          joinRoom(roomName);
        } else {
          showMessageModal({ message: "Room with such name already exists" });
        }
      });
    },
  });
});

readyButton.addEventListener("click", () => {
  const ready = readyButton.innerText === "READY" ? true : false;
  ready ? (readyButton.innerText = "NOT READY") : (readyButton.innerText = "READY");
  socket.emit("UPDATE_USER_STATUS", ready, roomNameTag.innerText);
});

leaveRoomButton.addEventListener("click", () => {
  socket.emit("LEAVE_ROOM", roomNameTag.innerText);
  addClass(gamePage, "display-none");
  removeClass(roomsPage, "display-none");
});

const startBeforeGameTimer = async (time, gameTime, textId) => {
  const textObject = await getText(textId);
  const text = textObject.text;
  textContainer.innerText = text;

  addClass(leaveRoomButton, "display-none");
  addClass(readyButton, "display-none");

  startTimer.innerText = time;
  gameTimer.innerText = gameTime;
  removeClass(startTimer, "display-none");

  const beforeGameTimer = setInterval(function () {
    if (time <= 0) {
      clearInterval(beforeGameTimer);
      addClass(startTimer, "display-none");
      removeClass(gameTimer, "display-none");
      removeClass(textContainer, "display-none");

      addEventListener("keyup", handleKeyPress);

      startGame(gameTime);
    } else {
      startTimer.innerText = time - 1;
    }
    time -= 1;
  }, 1000);
};

const startGame = (time) => {
  const timerForGame = setInterval(function () {
    if (time <= 0) {
      clearInterval(timerForGame);

      removeEventListener("keyup", handleKeyPress);

      socket.emit("GAME_OVER");
    } else {
      gameTimer.innerText = time - 1;
    }
    time -= 1;
  }, 1000);
};

const handleKeyPress = (e) => {
  console.log(textContainer.innerHTML);
};

socket.on("IS_ACTIVE_USER", handleCommonUsernames);
socket.on("UPDATE_ROOMS", updateRooms);
socket.on("UPDATE_ROOM_COUNTER", updateNumberOfUsersInRoom);
socket.on("EMPTY_ROOM", removeRoomElement);
socket.on("UPDATE_ROOM_USERS", updateRoomUsers);
socket.on("USER_LEFT_ROOM", userLeftRoom);
socket.on("USER_JOINED_ROOM", userJoinedRoom);
socket.on("CHANGE_USER_STATUS", changeReadyStatus);
socket.on("START_GAME", startBeforeGameTimer);
