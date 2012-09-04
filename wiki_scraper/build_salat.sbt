name := "scraper"

scalaVersion := "2.9.1"

libraryDependencies ++= Seq(
   "com.novus"            %% "salat-core"               % "0.0.8-SNAPSHOT"
)

resolvers ++= Seq(
  "repo.novus rels"       at "http://repo.novus.com/releases/",
  "repo.novus snaps"      at "http://repo.novus.com/snapshots/",
  "Typesafe Repository"   at "http://repo.typesafe.com/typesafe/releases/"
)