import { Server } from "socket.io";
import { createUser, deleteUser, isActiveUser } from "../helpers/helpers";
import { User } from "../types/types";
import * as config from "./config";

let activeUsers: User[] = [];

export default (io: Server) => {
  io.on("connection", (socket) => {
    const username = socket.handshake.query.username as string;

    console.log(`${username} connected ${socket.id}`);

    if (isActiveUser(activeUsers, username)) {
      socket.emit("IS_ACTIVE_USER");
    } else {
      activeUsers.push(createUser(username, socket.id));
    }

    console.log(activeUsers);

    socket.on("disconnect", () => {
      activeUsers = deleteUser(activeUsers, socket.id);

      console.log(`${username} disconnected ${socket.id}`);

      console.log(activeUsers);
    });
  });
};
