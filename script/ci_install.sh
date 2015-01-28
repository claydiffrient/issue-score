
# This is run during Travis CI installs

if [ $TRAVIS_OS_NAME = "osx" ]; then
  brew install nvm
  npm install
fi

if [ $TRAVIS_OS_NAME = "linux" ]; then
  npm install
fi
