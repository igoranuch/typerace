import { showInputModal, showMessageModal } from "./views/modal.mjs";
import { appendRoomElement, removeRoomElement, updateNumberOfUsersInRoom } from "./views/room.mjs";
import { addClass, removeClass } from "./helpers/domHelper.mjs";
import { appendUserElement, changeReadyStatus, setProgress, removeUserElement } from "./views/user.mjs";

const username = sessionStorage.getItem("username");

const roomsPage = document.getElementById("rooms-page");
const gamePage = document.getElementById("game-page");
const createRoomButton = document.getElementById("add-room-btn");
const leaveRoomButton = document.getElementById("quit-room-btn");
const usersContainer = document.getElementById("users-wrapper");
const roomsContainer = document.getElementById("rooms-wrapper");
const roomNameTag = document.getElementById("room-name");
const readyButton = document.getElementById("ready-btn");
const readyStatus = document.getElementById("ready-status");

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
    appendRoomElement({
      name: room.name,
      numberOfUsers: room.numberOfUsers,
      onJoin: () => {
        joinRoom(room.name);
      },
    });
  });
};

const updateRoomUsers = (users) => {
  usersContainer.innerHTML = "";
  users.forEach((user) => {
    console.log(user);
    appendUserElement({
      username: user.name,
      ready: user.isReady,
      isCurrentUser: user.name === username,
    });
  });
};

const joinRoom = (roomName) => {
  socket.emit("JOIN_ROOM", roomName, (isFull) => {
    if (!isFull) {
      addClass(roomsPage, "display-none");
      removeClass(gamePage, "display-none");
      roomNameTag.innerText = roomName;
    }
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

socket.on("IS_ACTIVE_USER", handleCommonUsernames);
socket.on("UPDATE_ROOMS", (rooms) => updateRooms(rooms));
socket.on("UPDATE_ROOM_COUNTER", (room) => updateNumberOfUsersInRoom(room));
socket.on("EMPTY_ROOM", removeRoomElement);
socket.on("UPDATE_ROOM_USERS", (users) => updateRoomUsers(users));
