import unfiltered.request._
import unfiltered.response._
import com.mongodb.casbah.Imports._
import com.codahale.jerkson.Json
import scala.collection.mutable.HashMap

import org.clapper.avsl.Logger

/** unfiltered plan */
class App extends unfiltered.filter.Plan {
  import QParams._
  val logger = Logger(classOf[App])
  val db_articles = MongoConnection()("wikipedia")("articles")

  object Callback extends Params.Extract(
    "callback",
    Params.first ~> Params.nonempty
  )

  def intent = {
    case GET(Path(Seg("children" :: p :: Nil)) & Params(Callback(callback))) =>
      logger.debug("GET /children/%s with callback %s".format(p, callback))
      Ok ~> ResponseHeader("Content-Type", List("application/json")) ~>
        ResponseString(callback + "(" + get_children(p) + ")")
    case GET(Path(Seg("parents" :: p :: Nil)) & Params(Callback(callback))) =>
      logger.debug("GET /parents/%s with callback %s".format(p, callback))
      Ok ~> ResponseHeader("Content-Type", List("application/json")) ~>
        ResponseString(callback + "(" + get_parents(p) + ")")
    case _ =>
      logger.debug("Bad Request")
      Pass
  }

  def get_children(article_title: String): String = {
    val q = MongoDBObject("title" -> article_title)
    val article = db_articles.findOne(q)
    if (article.isEmpty) {
      return "Article " + article_title + " not found"
    }
    Json.generate(article.get.as[BasicDBList]("children").toList)
  }

  def get_parents(article_title: String): String = {
    val q = MongoDBObject("title" -> article_title)
    val article = db_articles.findOne(q)
    if (article.isEmpty) {
      return "Article " + article_title + " not found"
    }
    Json.generate(article.get.as[BasicDBList]("parents").toList)
  }
}

/** embedded server */
object Server {
  def main(args: Array[String]) {
    val http = unfiltered.jetty.Http.local(23000).filter(new App).run()
  }
}
