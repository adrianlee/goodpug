FROM ubuntu:14.04

RUN apt-get update
RUN apt-get install -y lib32gcc1
RUN apt-get install wget -y

RUN useradd docker && echo "docker:docker" | chpasswd && adduser docker sudo
RUN mkdir -p /home/docker && chown -R docker:docker /home/docker

USER docker

RUN mkdir /home/docker/steamcmd

WORKDIR /home/docker/steamcmd

RUN wget http://media.steampowered.com/installer/steamcmd_linux.tar.gz
RUN tar -xvzf steamcmd_linux.tar.gz

RUN ./steamcmd.sh \
        +login anonymous \
        +force_install_dir ./csgo \
        +app_update 740 validate \
        +quit

CMD /bin/bash