# typed: strict
# frozen_string_literal: true

# Homebrew formula for the `webfont` Node CLI (monorepo tap).
#
#   brew tap itgalaxy/webfont https://github.com/itgalaxy/webfont
#   brew install itgalaxy/webfont/webfont
#
# On each npm release, bump url/sha256 with:
#   node scripts/sync-homebrew-formula.mjs
class Webfont < Formula
  desc "Generator of fonts from SVG icons, with TTF encoding and WOFF/WOFF2 decoding"
  homepage "https://github.com/itgalaxy/webfont"
  url "https://registry.npmjs.org/webfont/-/webfont-12.4.1.tgz"
  sha256 "cc22a60186c0ec0d7367945bff513318ad736bb39b3705d4b00b70c18584eb28"
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
