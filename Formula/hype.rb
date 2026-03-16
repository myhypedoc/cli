class Hype < Formula
  desc "CLI for Hype Doc: log and track your wins from the terminal"
  homepage "https://github.com/myhypedoc/cli"
  version "1.0.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/myhypedoc/cli/releases/download/v#{version}/hype-darwin-arm64"
      sha256 "PLACEHOLDER"
    else
      url "https://github.com/myhypedoc/cli/releases/download/v#{version}/hype-darwin-x64"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/myhypedoc/cli/releases/download/v#{version}/hype-linux-arm64"
      sha256 "PLACEHOLDER"
    else
      url "https://github.com/myhypedoc/cli/releases/download/v#{version}/hype-linux-x64"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    binary_name = stable.url.split("/").last
    bin.install binary_name => "hype"
  end

  test do
    assert_match "Hype Doc CLI", shell_output("#{bin}/hype --help")
  end
end
