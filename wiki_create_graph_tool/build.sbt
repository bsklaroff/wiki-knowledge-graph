name := "create_graph_tool"

version := "0.0.1"

seq(coffeeSettings: _*)

(resourceManaged in (Compile, CoffeeKeys.coffee)) <<= (crossTarget in Compile)(_ / "resources" / "js")

libraryDependencies ++= Seq(
  "net.databinder" %% "unfiltered-filter" % "0.6.2",
  "net.databinder" %% "unfiltered-jetty" % "0.6.2",
  "net.databinder" %% "unfiltered-json" % "0.6.2",
  "org.clapper" %% "avsl" % "0.3.6",
  "net.databinder" %% "unfiltered-spec" % "0.6.2" % "test",
  "com.mongodb.casbah" %% "casbah" % "2.1.5-1",
  "com.codahale" % "jerkson_2.9.1" % "0.5.0"
)

resolvers ++= Seq(
  "java m2" at "http://download.java.net/maven/2",
  "Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/",
  "repo.codahale.com" at "http://repo.codahale.com"
)
