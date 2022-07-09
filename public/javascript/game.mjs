import { showMessageModal } from "./views/modal.mjs";

const username = sessionStorage.getItem("username");

const roomsPage = document.getElementById("rooms-page");
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

socket.on("IS_ACTIVE_USER", handleCommonUsernames);
