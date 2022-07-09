import { Server } from "socket.io";
import { createRoom, isActiveRoom } from "../services/roomService";
import { createUser, deleteUser, isActiveUser } from "../services/userService";
import { Room, User } from "../types/types";
import * as config from "./config";

let activeUsers: User[] = [];
let activeRooms: Room[] = [];

export default (io: Server) => {
  io.on("connection", (socket) => {
    const username = socket.handshake.query.username as string;

    if (isActiveUser(activeUsers, username)) {
      socket.emit("IS_ACTIVE_USER");
    } else {
      activeUsers.push(createUser(username, socket.id));
    }

    socket.emit("UPDATE_ROOMS", activeRooms);

    socket.on("disconnect", () => {
      activeUsers = deleteUser(activeUsers, socket.id);
    });

    socket.on("CREATE_ROOM", (roomName) => {
      if (isActiveRoom(activeRooms, roomName)) {
        socket.emit("IS_ACTIVE_ROOM");
      } else {
        const newRoom: Room = createRoom(roomName, 0);
        activeRooms.push(newRoom);
        console.log(activeRooms);
        socket.emit("UPDATE_ROOMS", [newRoom]);
      }
    });
  });
};
