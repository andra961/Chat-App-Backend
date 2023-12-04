-- Active: 1697804885228@@127.0.0.1@5000@chat

--start a transaction so we can make an atomic operation where we create the chat and add its owner as first member
BEGIN;
INSERT INTO Chat (ownerId, name) VALUES ($1, $2);  --create the chat with ownerId as owner:
INSERT INTO _member (A, B) VALUES (lastval(), $1); --add the owner as member of the newly created chat, lastVal() will be the id of the last created chat
COMMIT;