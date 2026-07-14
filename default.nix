# Mindwtr desktop (Tauri v2), built from this fork's working tree.
#
# Intended to live at the root of your Mindwtr fork, with the cleartext-banner
# removal committed as a normal git change in
# apps/desktop/src/components/Layout.tsx. Rebasing/merging upstream will then
# surface conflicts in git if upstream touches that code.
#
# Usage:
#   nix-build                     # from the fork root
#   ./result/bin/mindwtr
#
# First build (trust-on-first-use for the one hash):
#   1. nix-build   -> copy the reported hash into `nodeModulesHash`
#   2. nix-build   -> builds for real
#
# nodeModulesHash only changes when bun.lock / package.json files change, or
# when the bun version in your nixpkgs channel changes. Everything else is
# maintenance-free: version is read from apps/desktop/src-tauri/tauri.conf.json
# and cargo deps are vendored per-crate from Cargo.lock's own checksums (see
# `cargoDeps` below). Source-code-only changes (like the banner patch) never
# require re-hashing.

{
  pkgs ? import <nixpkgs> { },
  # Local fork checkout by default. For a pinned, reproducible build you can
  # override this with pkgs.fetchFromGitHub { owner = "<you>"; repo = "Mindwtr";
  # rev = "<commit>"; hash = "..."; } — everything below works the same.
  src ? pkgs.lib.cleanSource ./.,
}:

let
  inherit (pkgs) lib;

  pname = "mindwtr";
  # Track the app's own version; reads the fork's tauri.conf.json.
  version = (builtins.fromJSON (
    builtins.readFile ./apps/desktop/src-tauri/tauri.conf.json
  )).version;

  # --- Fill this in (see header) -----------------------------------------
  nodeModulesHash = "sha256-+Uf6I1kDsBrrQPoWKmPTzvAZbK/EIfynOzGXaVeUhI0=";
  # -----------------------------------------------------------------------

  # Bun workspace dependencies as a fixed-output derivation. Upstream pins
  # bun 1.3.5 (.bun-version); nixpkgs' bun is usually close enough.
  nodeModules = pkgs.stdenv.mkDerivation {
    pname = "${pname}-node-modules";
    inherit version src;

    nativeBuildInputs = [
      pkgs.bun
      pkgs.cacert
    ];

    dontConfigure = true;
    dontFixup = true;

    buildPhase = ''
      runHook preBuild
      export HOME=$TMPDIR
      export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
      bun install --frozen-lockfile --ignore-scripts --no-progress
      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall
      mkdir -p $out
      # Copy every node_modules dir (root hoist + any nested workspace ones),
      # preserving the relative workspace symlinks (e.g. @mindwtr/core).
      for d in $(find . -type d -name node_modules -prune); do
        mkdir -p "$out/$(dirname "$d")"
        cp -a "$d" "$out/$d"
      done
      # Strip caches that would make the output nondeterministic.
      find $out -type d -name .cache -prune -exec rm -rf {} +
      runHook postInstall
    '';

    outputHashMode = "recursive";
    outputHashAlgo = "sha256";
    outputHash = nodeModulesHash;
    impureEnvVars = lib.fetchers.proxyImpureEnvVars;
  };
in
pkgs.rustPlatform.buildRustPackage {
  inherit pname version src;

  # Vendor crates from the lockfile's own per-crate checksums instead of a
  # single `cargoHash`. Two reasons:
  #   - no cargoHash TOFU step;
  #   - `cargoHash` uses fetchCargoVendor, which on nixpkgs 25.05/25.11 still
  #     downloads through https://crates.io/api/v1/.../download — an endpoint
  #     crates.io now rate-limits at 1 req/sec, so its parallel fetcher dies
  #     with 403s (fixed only on nixpkgs unstable). extraRegistries reroutes
  #     the downloads to the static.crates.io CDN, which has no such limit.
  # "${src}" keeps the lockfile consistent with `src` even when overridden.
  #
  # The overrideAttrs sed is needed because importCargoLock also emits a
  # [source."<index-url>"] block for every extraRegistries key; ours IS the
  # crates-io index, so cargo would see crates-io defined twice and abort
  # ("Sources are not allowed to be defined multiple times"). The override
  # only matters at download time; cargo must never see it.
  cargoDeps =
    (pkgs.rustPlatform.importCargoLock {
      lockFile = "${src}/apps/desktop/src-tauri/Cargo.lock";
      extraRegistries = {
        "https://github.com/rust-lang/crates.io-index" = "https://static.crates.io/crates";
      };
    }).overrideAttrs
      (old: {
        buildCommand = old.buildCommand + ''
          sed -i '\%^\[source\."https://github\.com/rust-lang/crates\.io-index"\]%,+2d' \
            $out/.cargo/config.toml
        '';
      });

  cargoRoot = "apps/desktop/src-tauri";
  buildAndTestSubdir = "apps/desktop/src-tauri";

  nativeBuildInputs = [
    pkgs.cargo-tauri.hook
    pkgs.bun
    pkgs.nodejs # interpreter for node_modules/.bin shebangs (tsc, vite)
    pkgs.pkg-config
    pkgs.wrapGAppsHook3

    # whisper-rs-sys builds whisper.cpp with cmake and generates its FFI
    # bindings with bindgen (which needs libclang — the hook provides it).
    pkgs.cmake
    pkgs.rustPlatform.bindgenHook
  ];

  # cmake above is only for the whisper-rs-sys build script; keep stdenv's
  # cmake hook from hijacking this derivation's configurePhase.
  dontUseCmakeConfigure = true;

  buildInputs = [
    pkgs.glib
    pkgs.gtk3
    pkgs.libsoup_3
    pkgs.openssl
    pkgs.webkitgtk_4_1
    pkgs.glib-networking # TLS for the webview / HTTPS endpoints
    pkgs.libayatana-appindicator # tray icon
    pkgs.alsa-lib # cpal (microphone capture for whisper) -> alsa-sys
  ];

  # Restore the bun workspace before the tauri hook runs beforeBuildCommand
  # ("bun run build:vite" inside apps/desktop). Writable copy: vite wants to
  # create node_modules/.vite, and tsc/vite bins resolve from the root hoist.
  # patchShebangs rewrites `#!/usr/bin/env node` to the store's node — the
  # sandbox has no /usr/bin/env, so the bins are unexecutable as shipped.
  preBuild = ''
    for d in $(cd ${nodeModules} && find . -type d -name node_modules -prune); do
      mkdir -p "$(dirname "$d")"
      cp -a ${nodeModules}/"$d" "$d"
      chmod -R u+w "$d"
      patchShebangs "$d"
    done
    export HOME=$TMPDIR
  '';

  # reqwest's `native-tls-vendored` feature makes openssl-sys compile OpenSSL
  # from source (openssl-src), which needs perl and fights the sandbox. This
  # tells its build script to link the system (nixpkgs) OpenSSL instead —
  # openssl + pkg-config are already in the inputs.
  env.OPENSSL_NO_VENDOR = 1;

  # Rust tests need a display / are not the point of this build.
  doCheck = false;

  postInstall = ''
    # The tauri deb bundler auto-generates usr/share/applications/Mindwtr.desktop
    # and the cargo-tauri hook installs the whole bundle tree into $out. Together
    # with the curated entry below, launchers would show Mindwtr twice — keep
    # only the repo's own desktop file.
    rm -f $out/share/applications/*.desktop

    install -Dm644 apps/desktop/src-tauri/linux/tech.dongdongbh.mindwtr.desktop \
      $out/share/applications/tech.dongdongbh.mindwtr.desktop
    install -Dm644 apps/desktop/src-tauri/linux/Mindwtr.metainfo.xml \
      $out/share/metainfo/tech.dongdongbh.mindwtr.metainfo.xml
    install -Dm644 apps/desktop/src-tauri/icons/32x32.png \
      $out/share/icons/hicolor/32x32/apps/tech.dongdongbh.mindwtr.png
    install -Dm644 apps/desktop/src-tauri/icons/64x64.png \
      $out/share/icons/hicolor/64x64/apps/tech.dongdongbh.mindwtr.png
    install -Dm644 apps/desktop/src-tauri/icons/128x128.png \
      $out/share/icons/hicolor/128x128/apps/tech.dongdongbh.mindwtr.png
    install -Dm644 "apps/desktop/src-tauri/icons/128x128@2x.png" \
      $out/share/icons/hicolor/256x256/apps/tech.dongdongbh.mindwtr.png
  '';

  # The appindicator library is dlopen()ed at runtime for the tray icon.
  preFixup = ''
    gappsWrapperArgs+=(
      --prefix LD_LIBRARY_PATH : ${lib.makeLibraryPath [ pkgs.libayatana-appindicator ]}
    )
  '';

  meta = {
    description = "Local-first GTD app (fork: no global cleartext-HTTP warning banner)";
    homepage = "https://github.com/dongdongbh/Mindwtr";
    license = lib.licenses.agpl3Only;
    mainProgram = "mindwtr";
    platforms = lib.platforms.linux;
  };
}
