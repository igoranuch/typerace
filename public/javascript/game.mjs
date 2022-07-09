import { showInputModal, showMessageModal } from "./views/modal.mjs";
import { appendRoomElement, updateNumberOfUsersInRoom } from "./views/room.mjs";

const username = sessionStorage.getItem("username");

const roomsPage = document.getElementById("rooms-page");
const gamePage = document.getElementById("game-page");
const createRoomButtom = document.getElementById("add-room-btn");

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

createRoomButtom.addEventListener("click", () => {
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
      socket.emit("CREATE_ROOM", roomName);
    },
  });
});

const handleCommonRoomName = () => {
  showMessageModal({ message: "Room with such name already exists" });
};

const updateRooms = (rooms) => {
  rooms.forEach((room) => {
    appendRoomElement({ name: room.name, numberOfUsers: room.userCount, onJoin: () => {} });
  });
};

socket.on("IS_ACTIVE_USER", handleCommonUsernames);
socket.on("IS_ACTIVE_ROOM", handleCommonRoomName);
socket.on("UPDATE_ROOMS", (rooms) => updateRooms(rooms));
