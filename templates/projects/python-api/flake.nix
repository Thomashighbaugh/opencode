{
  description = "Python API development environment with uv";

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
            uv
            python311
            python311Packages.pip
            python311Packages.venvShellHook
            ruff
            mypy
            pytest
            pytest-cov-stub
          ];

          shellHook = ''
            echo "Python dev shell loaded"
            echo "  Python version: $(python --version)"
            echo "  uv version: $(uv --version)"

            # Create virtual environment with uv if not exists
            if [ ! -d .venv ]; then
              uv venv --python 3.11
            fi

            # Activate virtual environment
            source .venv/bin/activate

            # Install dependencies if pyproject.toml exists
            if [ -f pyproject.toml ]; then
              uv sync
            fi
          '';
        };
      });
}
