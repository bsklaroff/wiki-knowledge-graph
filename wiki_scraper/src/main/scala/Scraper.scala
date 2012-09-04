import com.mongodb.casbah.Imports._
import scala.collection.mutable.HashSet
import scala.collection.mutable.HashMap
import org.jsoup._
import java.net._
import java.io._

object Scraper {
  var parent_title = "DNA"
  var count: Long = 0
  var bad_words = new HashSet[String]
  val db_articles = MongoConnection()("wikipedia")("articles")
  val db_article_queue = MongoConnection()("wikipedia")("article_queue")

  def main(args: Array[String]) {
    val basic_namespaces = List("User", "Wikipedia", "File", "MediaWiki", "Template", "Help", "Category",
				"Portal", "Book")
    val more_namespaces = List("Talk", "Special", "Media")
    bad_words = bad_words ++ basic_namespaces ++ basic_namespaces.map(s => s + " talk") ++ more_namespaces

    count = db_articles.count
    while (process_next_article()) {
      count += 1
      if (count % 100 == 0) {
	println(count + " articles processed")
      }
    }
  }

  def process_next_article(): Boolean = {
    var q = db_article_queue.findOne(MongoDBObject("parents" -> parent_title))
    if (parent_title == "") {
      q = db_article_queue.findOne()
      parent_title = q.get.as[String]("title")
      println("new parent title: " + parent_title)
    }
    if (q.isEmpty) {
      db_articles.update(MongoDBObject("title" -> parent_title), $set("children_done" -> true))
      val p = db_articles.findOne(MongoDBObject("parents" -> "DNA", "children_done" -> false))
      if (p.isEmpty) {
	return false
      }
      parent_title = p.get.as[String]("title")
      println("new parent title: " + parent_title)
      println(count + " articles processed")
      count -= 1
      return true
    }
    val article_title = q.get.as[String]("title")
    db_article_queue.remove(MongoDBObject("title" -> article_title))
    val article = MongoDBObject("title" -> article_title,
				"parents" -> q.get.as[BasicDBList]("parents"),
				"children_done" -> false)
    db_articles += article
    val article_url = new URL("http://en.wikipedia.org/wiki/" + article_title)
    val in_stream = new BufferedReader(new InputStreamReader(article_url.openStream()))
    var next_line = in_stream.readLine()
    var html = ""
    while (next_line != null) {
      html += next_line + "\n"
      next_line = in_stream.readLine()
    }
    val doc = Jsoup.parse(html)

    // This removes the Notes, Reference, and External links sections
    val headlines = doc.getElementsByClass("mw-headline")
    for (i <- 0 until headlines.size()) {
      val headline = headlines.get(i)
      val hid = headline.attr("id")
      val bad_sections = HashSet("Notes", "References", "External_links", "Notes_and_in-line_references",
				 "Selected_books", "References_and_notes", "Notes_and_citations",
				 "Notes_and_references", "Further_reading", "Reflist", "Footnotes",
				 "Sources", "References_and_external_links", "Bibliography", "Endnotes",
				 "References_and_sources", "References_and_footnotes", "Sources_and_notes",
				 "Reference_notes", "Citations", "Footnotes_and_references", "General_references",
			         "Sources_and_further_reading", "Cited_references", "References_cited",
			         "References_and_further_reading", "References_and_in-line_notes")
      if (bad_sections.contains(hid)) {
	var next_element = if (headline.parent().siblingElements().isEmpty()) null else headline.parent().nextElementSibling()
        while (next_element != null && next_element.tag() != "h2") {
          next_element.empty()
          next_element = next_element.nextElementSibling()
        } 
      }
    }

    // This counts the number of times each link appears on the page
    var link_count = new HashMap[String, Int]
    val links = doc.getElementsByTag("a")
    for (i <- 0 until links.size()) {
      val link = links.get(i)
      val href = link.attr("href")
      if (href.slice(0, 6) == "/wiki/") {
        val href_short = href.slice(6, href.length).split("#")(0)
        val href_split = href_short.split(":")
        if (!(href_split.length > 1 && bad_words.contains(href_split(0)))) {
          if (!link_count.contains(href_short)) {
            link_count += href_short -> 0
          }
          link_count(href_short) += 1
        }
      }
    }

    val links_ordered = link_count.toList.sortBy{_._2}.reverse
    for (i <- 0 until links_ordered.length) {
      val next_article_title = links_ordered(i)._1
      if (next_article_title == "International_Standard_Book_Number") {
        println(article_title + " leads to ISBN")
      }
      if (next_article_title != article_title && next_article_title != "Main_Page") {
	db_articles.update(article, $push("children" -> next_article_title))
	val next_article = MongoDBObject("title" -> next_article_title)
	val found = db_articles.findOne(next_article)
	if (found.isEmpty) {
	  val queued = db_article_queue.findOne(next_article)
	  if (queued.isEmpty) {
	    db_article_queue += next_article
	  }
	  db_article_queue.update(next_article, $push("parents" -> article_title))
	} else {
	  db_articles.update(next_article, $push("parents" -> article_title))
	}
      }
    }
    in_stream.close()
    return true
  }
}
