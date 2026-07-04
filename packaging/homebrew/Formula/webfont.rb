# typed: false
# frozen_string_literal: true

# Homebrew formula for the `webfont` Node CLI.
#
# Source of truth lives in the itgalaxy/webfont repo under
# packaging/homebrew/. It is mirrored to the Homebrew tap so users can run:
#
#   brew install itgalaxy/tap/webfont
#
# On each npm release, bump `url` + `sha256` to the new tarball. Get the sha256
# with:  curl -sL <tarball-url> | shasum -a 256
class Webfont < Formula
  desc "Generator of fonts from SVG icons, with TTF encoding and WOFF/WOFF2 decoding"
  homepage "https://github.com/itgalaxy/webfont"
  url "https://registry.npmjs.org/webfont/-/webfont-12.4.0.tgz"
  sha256 "c473cc6be649d17f94d6984ad04995514ed9b2cdb8afec6107c96db95787fbc2"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    (testpath/"icon.svg").write <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2 2h12v12H2z"/></svg>
    SVG

    system bin/"webfont", testpath/"icon.svg", "-d", testpath, "-f", "woff2"
    assert_path_exists testpath/"webfont.woff2"
  end
end
