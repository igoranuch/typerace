import { Server } from "socket.io";
import { createRoom, deleteRoom, getRoom, isActiveRoom, updateNumberOfUsers } from "../services/roomService";
import {
  addUserRoom,
  createUser,
  deleteUser,
  getUser,
  getUsersFromRoom,
  isActiveUser,
  removeUserRoom,
} from "../services/userService";
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
      handleLeaveRoom(socket);
      activeUsers = deleteUser(activeUsers, socket.id);
    });

    socket.on("CREATE_ROOM", (roomName, callback) => {
      const isActive = isActiveRoom(activeRooms, roomName);
      if (!isActive) {
        const newRoom: Room = createRoom(roomName, 0);
        activeRooms.push(newRoom);
        socket.emit("UPDATE_ROOMS", activeRooms);
        socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
      }
      callback(isActive);
    });

    socket.on("JOIN_ROOM", (roomName, callback) => {
      const targetedRoom = getRoom(activeRooms, roomName);
      const isFull = targetedRoom && targetedRoom.numberOfUsers === config.MAXIMUM_USERS_FOR_ONE_ROOM;

      if (!isFull) {
        activeRooms = updateNumberOfUsers(activeRooms, roomName, 1);
        activeUsers = addUserRoom(activeUsers, socket.id, roomName);
        socket.join(roomName);

        const updatedRoom = getRoom(activeRooms, roomName);

        if (updatedRoom) {
          socket.broadcast.emit("UPDATE_ROOM_COUNTER", updatedRoom);
        }
      }

      callback(isFull);

      io.in(roomName).emit("UPDATE_ROOM_USERS", getUsersFromRoom(activeUsers, roomName));
    });

    socket.on("LEAVE_ROOM", (roomName) => {
      handleLeaveRoom(socket);

      io.in(roomName).emit("UPDATE_ROOM_USERS", getUsersFromRoom(activeUsers, roomName));
    });
  });
};

const handleLeaveRoom = (socket) => {
  const user = getUser(activeUsers, socket.id);

  if (user && user.room) {
    activeRooms = updateNumberOfUsers(activeRooms, user.room, -1);
    socket.leave(user.room);
    activeUsers = removeUserRoom(activeUsers, socket.id);

    socket.emit("UPDATE_ROOMS", activeRooms);
    socket.emit("UPDATE_ROOM_COUNTER", getRoom(activeRooms, user.room));
    socket.broadcast.emit("UPDATE_ROOM_COUNTER", getRoom(activeRooms, user.room));

    handleEmptyRoom(socket, user);
  }
};

const handleEmptyRoom = (socket, user) => {
  const room = getRoom(activeRooms, user.room);

  if (room?.numberOfUsers === 0) {
    activeRooms = deleteRoom(activeRooms, room.name);
    socket.emit("EMPTY_ROOM", room.name);
    socket.emit("UPDATE_ROOMS", activeRooms);
    socket.broadcast.emit("UPDATE_ROOMS", activeRooms);
  }
};
