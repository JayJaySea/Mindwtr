{ pkgs ? import <nixpkgs> { } }:

# Binary install of Mindwtr from the upstream GitHub release.
#
# Why not build from source? The app is a Tauri 2.x frontend built with the
# `bun` package manager in a workspace monorepo. Neither bun nor npm can
# resolve the `file:../../packages/core` workspace + its transitive deps
# reproducibly inside the Nix sandbox without network access. The AUR package
# (see ./aur/PKGBUILD) takes the same approach — install the prebuilt `.deb`.
#
# If upstream adds an x86_64 AppImage or arm64 build, extend `sources` below.

let
  inherit (pkgs) lib stdenv fetchurl autoPatchelfHook dpkg wrapGAppsHook3;

  pname = "mindwtr";
  version = "0.8.3";

  src = fetchurl {
    url = "https://github.com/dongdongbh/Mindwtr/releases/download/v${version}/mindwtr_${version}_amd64.deb";
    hash = "sha256-UK/ErvKpdBYjAJfY9s2Dfx3uHOIQQb8VDCqBAh43HIU=";
  };
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
