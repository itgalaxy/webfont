# typed: strict
# frozen_string_literal: true

# Homebrew formula for the `webfont` Node CLI (monorepo tap).
#
#   brew tap itgalaxy/webfont https://github.com/itgalaxy/webfont
#   brew install webfont
#
# On each npm release, bump url/sha256 with:
#   node scripts/sync-homebrew-formula.mjs
#
# homebrew-core copy: npm run render:homebrew-core (tracking #785)
class Webfont < Formula
  desc "Generator of fonts from SVG icons, with TTF encoding and WOFF/WOFF2 decoding"
  homepage "https://webfont.js.org/"
  url "https://registry.npmjs.org/webfont/-/webfont-12.6.0.tgz"
  sha256 "c82f02d4c4332186d0d1c5d7036d5fb477b1fbc718c6620b0d99eecf0b96f1ee"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    (testpath/"icon.svg").write <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2 2h12v12H2z"/></svg>
    SVG

    system bin/"webfont", testpath/"icon.svg", "-d", testpath, "-f", "woff2"
    assert_path_exists testpath/"webfont.woff2"
    assert_match version.to_s, shell_output("#{bin}/webfont --version")
  end
end
