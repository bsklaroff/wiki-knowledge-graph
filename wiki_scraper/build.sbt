name := "scraper"

scalaVersion := "2.9.1"

libraryDependencies ++= Seq(
   "com.mongodb.casbah" %% "casbah" % "2.1.5-1"
)

resolvers ++= Seq(
  "Typesafe Repository"   at "http://repo.typesafe.com/typesafe/releases/"
)