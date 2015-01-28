
# This is run during Travis CI installs

if [ $TRAVIS_OS_NAME = "osx" ]; then
  brew install nvm
fi

