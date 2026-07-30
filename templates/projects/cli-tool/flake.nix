{
  description = "CLI tool development environment — multi-language build and test toolchain";

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
            # Core CLI tools
            just
            shellcheck
            shfmt

            # Node.js (if applicable)
            nodejs_22

            # Static analysis
            typos
            actionlint
          ];

          shellHook = ''
            echo "CLI dev shell loaded"
            echo "  Node: $(node --version 2>/dev/null || echo 'not available')"
            echo "  Tools: just, shellcheck, typos, actionlint"
          '';
        };
      });
}
