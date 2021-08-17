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

EXPOSE 3000
CMD [ "npm", "start" ]
