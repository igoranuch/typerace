import { showInputModal, showMessageModal, showResultsModal } from "./views/modal.mjs";
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
const gameTimerSeconds = document.getElementById("game-timer-seconds");
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

const startGame = async (textId) => {
  const textObject = await getText(textId);
  const gameText = textObject.text;
  textContainer.innerText = gameText;

  addClass(leaveRoomButton, "display-none");
  addClass(readyButton, "display-none");
};

const startingTimerHandler = (time) => {
  startTimer.innerText = time;
  removeClass(startTimer, "display-none");
};

const gameTimerHandler = (time) => {
  addClass(startTimer, "display-none");
  removeClass(textContainer, "display-none");

  gameTimerSeconds.innerText = time;
  removeClass(gameTimer, "display-none");
};

const showResultAndReset = (users) => {
  addClass(gameTimer, "display-none");
  addClass(textContainer, "display-none");
  removeClass(leaveRoomButton, "display-none");

  readyButton.innerText = "READY";
  removeClass(readyButton, "display-none");

  showResultsModal({
    usersSortedArray: users
      .sort((a, b) => {
        a.progress > b.progress;
      })
      .map((user) => user.name),
    onClose: () => {},
  });

  socket.emit("RESET_USERS_IN_ROOM", roomNameTag.innerText);
};

socket.on("IS_ACTIVE_USER", handleCommonUsernames);
socket.on("UPDATE_ROOMS", updateRooms);
socket.on("UPDATE_ROOM_COUNTER", updateNumberOfUsersInRoom);
socket.on("EMPTY_ROOM", removeRoomElement);
socket.on("UPDATE_ROOM_USERS", updateRoomUsers);
socket.on("USER_LEFT_ROOM", userLeftRoom);
socket.on("USER_JOINED_ROOM", userJoinedRoom);
socket.on("CHANGE_USER_STATUS", changeReadyStatus);
socket.on("START_GAME", startGame);
socket.on("STARTING_TIMER", startingTimerHandler);
socket.on("GAME_TIMER", gameTimerHandler);
socket.on("SHOW_RESULT", showResultAndReset);
