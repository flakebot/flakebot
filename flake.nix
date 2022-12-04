{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }: let
    defaultSystems = [
      "aarch64-darwin"
      "aarch64-linux"
      "x86_86-darwin"
      "x86_86-linux"
    ];
  in {
    devShells = flake-utils.lib.eachSystemMap defaultSystems (system: let
      pkgs = import nixpkgs {
        inherit system;
      };
    in {
      default =
        pkgs.mkShell
        {
          buildInputs = with pkgs; [
            nixUnstable
            nodejs
            google-cloud-sdk
            flyctl
          ];
        };
    });
  };
}
