{
  description = "Rust development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" "clippy" "rustfmt" ];
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            rustToolchain
            cargo-nextest
            cargo-audit
            cargo-edit
            cargo-watch
            cargo-expand
            cargo-tarpaulin
            bacon
            tokei
          ];

          shellHook = ''
            echo "Rust dev shell loaded"
            echo "  Rust version: $(rustc --version)"
            echo "  Cargo version: $(cargo --version)"
            echo "  Tools: nextest, audit, expand, tarpaulin"
          '';
        };
      });
}
