FROM nixos/nix:latest
WORKDIR /etc/nix
RUN echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf
RUN nix-channel --update
RUN nix-env -iA nixpkgs.nixUnstable
RUN nix-env -iA nixpkgs.nodejs

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

ENV PORT=3000
EXPOSE $PORT
CMD [ "npm", "start" ]