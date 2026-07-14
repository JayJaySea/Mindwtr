{ pkgs ? import <nixpkgs> { } }:

# Binary install of Mindwtr from the upstream GitHub release.
#
# Why not build from source? The app is a Tauri 2.x frontend built with the
# `bun` package manager in a workspace monorepo. Neither bun nor npm can
# resolve the `file:../../packages/core` workspace + its transitive deps
# reproducibly inside the Nix sandbox without network access. The AUR package
# (see ./aur/PKGBUILD) takes the same approach — install the prebuilt `.deb`.
#
# This expression tracks the LATEST release instead of a pinned version. That
# makes it an IMPURE derivation: it queries the GitHub API and fetches the
# `.deb` without a pinned hash at evaluation time, so it re-resolves whenever
# upstream publishes a new release. Consequences:
#   * Build with plain `nix-build` (impure eval is the default). A flake or any
#     `--pure-eval` context will REJECT the unhashed `builtins.fetchurl` calls.
#   * The result is not reproducible and is not cached against a fixed hash —
#     the API is hit on every evaluation.
# If you want a reproducible pin again, replace the `release`/`src` lets with a
# `pkgs.fetchurl { url = ...; hash = ...; }` and a fixed `version`.

let
  inherit (pkgs) lib stdenv autoPatchelfHook dpkg wrapGAppsHook3;

  pname = "mindwtr";

  owner = "dongdongbh";
  repo = "Mindwtr";

  # Latest release metadata, fetched (unpinned) at eval time.
  release = builtins.fromJSON (builtins.readFile (builtins.fetchurl
    "https://api.github.com/repos/${owner}/${repo}/releases/latest"));

  # Tag looks like "v1.1.0"; the package version drops the leading "v".
  version = lib.removePrefix "v" release.tag_name;

  # Pick the amd64 .deb asset out of the release's asset list.
  asset = lib.findFirst
    (a: lib.hasSuffix "_amd64.deb" a.name)
    (throw "${repo} release ${release.tag_name} has no amd64 .deb asset")
    release.assets;

  # Unpinned fetch of the chosen asset (impure, re-fetched each new release).
  src = builtins.fetchurl asset.browser_download_url;
in
stdenv.mkDerivation {
  inherit pname version src;

  nativeBuildInputs = [
    autoPatchelfHook
    dpkg
    wrapGAppsHook3
  ];

  # Tauri 2 / webkit2gtk stack + libs loaded at runtime by the bundled binary.
  buildInputs = with pkgs; [
    glib
    gtk3
    cairo
    pango
    atk
    gdk-pixbuf
    webkitgtk_4_1
    libsoup_3
    libayatana-appindicator

    # Pulled in by Rust deps: reqwest (openssl), keyring (dbus/libsecret),
    # cpal (alsa), whisper-rs (stdc++).
    openssl
    dbus
    libsecret
    alsa-lib
    stdenv.cc.cc.lib
  ];

  unpackPhase = ''
    runHook preUnpack
    dpkg-deb -x $src .
    runHook postUnpack
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out
    cp -r usr/bin $out/
    cp -r usr/share $out/

    # Fix absolute paths in .desktop launcher so it points at $out.
    substituteInPlace $out/share/applications/*.desktop \
      --replace-quiet "/usr/bin" "$out/bin" || true

    runHook postInstall
  '';

  # Ensure the runtime-loaded tray/indicator lib is findable at startup.
  preFixup = ''
    gappsWrapperArgs+=(
      --prefix LD_LIBRARY_PATH : "${lib.makeLibraryPath [
        pkgs.libayatana-appindicator
      ]}"
    )
  '';

  meta = with lib; {
    description = "A Getting Things Done (GTD) productivity system — Mind Like Water";
    homepage = "https://dongdongbh.tech";
    downloadPage = "https://github.com/dongdongbh/Mindwtr/releases";
    license = licenses.agpl3Only;
    mainProgram = "mindwtr";
    platforms = [ "x86_64-linux" ];
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
    maintainers = [ ];
  };
}
