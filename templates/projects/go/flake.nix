{
  description = "Go development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            go
            gopls
            go-tools
            gotools
            golangci-lint
            goreleaser
            delve
            gotestsum
            go-migrate
          ];

          shellHook = ''
            echo "Go dev shell loaded"
            echo "  Go version: $(go version)"
            echo "  Tools: gopls, golangci-lint, delve, goreleaser"
          '';
        };
      });
}
