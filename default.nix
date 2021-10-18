{ lib, stdenv, fetchFromGitHub }:

stdenv.mkDerivation rec {
  pname = "CHANGE";
  version = "0.0.1";

  src = fetchFromGitHub {
    owner = "CHANGE";
    repo = pname;
    rev = "version";
    sha256 = "0000000000000000000000000000000000000000000000000000";
  };

  buildInputs = [ ];

  meta = with lib; {
    description = "CHANGE";
    homepage = "https://github.com/@owner@/@pname@";
    license = licenses.CHANGE;
    maintainers = with maintainers; [ sbacha ];
  };
}
