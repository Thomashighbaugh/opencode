{
  description = "Next.js web application development environment";

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
            nodejs_22
            nodePackages.pnpm
            nodePackages.typescript
            nodePackages.typescript-language-server
            vscode-langservers-extracted
            tailwindcss-language-server

            # Core utils
            just
            typos
            actionlint
          ];

          shellHook = ''
            echo "Next.js dev shell loaded"
            echo "  Node: $(node --version)"
            echo "  pnpm: $(pnpm --version)"
            echo "  Tools: tailwindcss-language-server, typescript-language-server"
          '';
        };
      });
}
