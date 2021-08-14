FROM nixos/nix:latest
WORKDIR /etc/nix
RUN echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf
RUN nix-channel --update
RUN nix-env -iA nixpkgs.nixUnstable
RUN nix-env -iA nixpkgs.nodejs

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
RUN npm cache clean --force
ENV NODE_ENV="production"
COPY . .
CMD [ "npm", "start" ]
