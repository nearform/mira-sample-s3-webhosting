FROM alpine/git:latest

COPY mirror.sh /mirror.sh
RUN ["chmod", "+x", "/mirror.sh"]
ENTRYPOINT ["sh", "/mirror.sh"]
