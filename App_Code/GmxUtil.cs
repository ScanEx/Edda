using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using Newtonsoft.Json.Linq;
using RequestParam = System.Collections.Generic.KeyValuePair<string, string>;

/// <summary>
/// Summary description for GmxUtil
/// </summary>
public class GmxUtil
{
    public static JObject SendPostRequest(string url, WebProxy proxy, IEnumerable<RequestParam> data)
    {
        WebResponse res = null;
        Stream rss = null;

        try
        {
            var req = WebRequest.Create(url) as HttpWebRequest;
            req.ProtocolVersion = HttpVersion.Version10;
            req.Method = WebRequestMethods.Http.Post;
            req.Credentials = CredentialCache.DefaultCredentials;
            var boundaryString = string.Format("----FormBoundary{0:x}", DateTime.Now.Ticks);
            req.ContentType = string.Format("multipart/form-data; boundary={0}", boundaryString);
            req.KeepAlive = true;
            if (proxy != null)
            {
                req.Proxy = proxy;
            }

            var postDataStream = new MemoryStream();
            var postDataWriter = new StreamWriter(postDataStream);

            // Include value from the myFileDescription text area in the post data
            foreach (var kv in data)
            {
                postDataWriter.Write(string.Format("\r\n--{0}\r\n", boundaryString));
                postDataWriter.Write(string.Format("Content-Disposition: form-data; name=\"{0}\"\r\n\r\n{1}", kv.Key, kv.Value));
            }

            postDataWriter.Flush();

            // Read the file      
            postDataWriter.Write(string.Format("\r\n--{0}--\r\n", boundaryString));
            postDataWriter.Flush();

            // Set the http request body content length
            req.ContentLength = postDataStream.Length;

            // Dump the post data from the memory stream to the request stream
            var s = req.GetRequestStream();
            postDataStream.WriteTo(s);
            postDataStream.Close();

            res = req.GetResponse();
            rss = res.GetResponseStream();

            var rd = new StreamReader(rss);

            var result = System.Web.HttpUtility.UrlDecode(rd.ReadToEnd());
            rss.Close();
            res.Close();

            var startIndex = ("<script>window.parent.postMessage('").Length;
            var len = result.Length - ("', '*');</script>").Length - startIndex;
            return JObject.Parse(result.Substring(startIndex, len));
        }
        catch (Exception)
        {
            if (rss != null)
            {
                rss.Close();
            }
            if (res != null)
            {
                res.Close();
            }
            throw;
        }
    }


}