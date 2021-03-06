﻿<%@ WebHandler Language="C#" Class="QuickLookImage" %>

using System;
using System.Web;
using CommonWebUtil;
using System.Net;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using System.Configuration;
using System.Security.Cryptography.X509Certificates;
using System.Net.Security;
using CommonUtil;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using Quicklook = System.Collections.Generic.Dictionary<string, object>;
using RequestParam = System.Collections.Generic.KeyValuePair<string, string>;

public class QuickLookImage : IHttpHandler
{
    static string DownloadedImagesCatalog = ConfigurationManager.AppSettings["DownloadedImagesCatalog"];

    string GetFileName(string platform, DateTime date, string sceneid)
    {
        return Path.ChangeExtension(Path.Combine(DownloadedImagesCatalog, platform.ToLower(), date.Year.ToString(), date.Month.ToString(), GetDayDirName(date), sceneid), ".jpg");
    }

    string GetDayDirName(DateTime date)
    {
        string dateDirName = null;
        if (1 <= date.Day && date.Day <= 10) dateDirName = "1-10";
        if (11 <= date.Day && date.Day <= 20) dateDirName = "11-20";
        if (21 <= date.Day && date.Day <= 31) dateDirName = "21-31";
        return dateDirName;
    }

    DateTime FromUnixDate(double milliseconds) {
        return new DateTime(1970, 1, 1).AddMilliseconds(milliseconds);
    }

    static void ScaleImage(Stream src, Stream dst, int width, int height)
    {
        var image = Image.FromStream(src);
        if (image.Width <= width && image.Height <= height) {
            image.Save(dst, ImageFormat.Jpeg);
        }
        else {
            var ratioX = (double)width / image.Width;
            var ratioY = (double)height / image.Height;
            var ratio = Math.Min(ratioX, ratioY);

            var newWidth = (int)(image.Width * ratio);
            var newHeight = (int)(image.Height * ratio);

            var newImage = new Bitmap(newWidth, newHeight);

            using (var graphics = Graphics.FromImage(newImage)) {
                graphics.DrawImage(image, 0, 0, newWidth, newHeight);
            }

            newImage.Save(dst, ImageFormat.Jpeg);
        }
    }

    byte[] GetImage(string sceneid, string platform, DateTime date, string url)
    {
        byte[] imageContent = null;
        DateTime dtStart = DateTime.Now;
        try
        {
            string imagePath = GetFileName(platform, date, sceneid);
            //if (File.Exists(imagePath))
            //{
            //    Trace.TraceInformation ("Image exists {0}", imagePath);
            //    return File.ReadAllBytes(imagePath);
            //}
            if (!String.IsNullOrWhiteSpace(url))
            {
                var uri = new Uri(url);
                if (uri.Scheme == "https") {
                    RemoteCertificateValidationCallback AcceptAllCertifications = delegate(object sender, X509Certificate certification, X509Chain chain, SslPolicyErrors sslPolicyErrors) { return true; };
                    ServicePointManager.ServerCertificateValidationCallback = new RemoteCertificateValidationCallback(AcceptAllCertifications);
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)768 | (SecurityProtocolType)3072;
                }
                Trace.TraceWarning ("Trying to get image {0} from url={1}", imagePath, url);
                // imageContent = ReadImage(url);
                // try
                // {
                //     imageContent = ReadImage(url);
                // }
                // catch {
                imageContent = WebHelper.ReadContent(url, 30);
                // }

                var imageRoot = new DirectoryInfo(DownloadedImagesCatalog);
                imageRoot.CreateDirIfNotExists();
                var satelliteFolder = new DirectoryInfo(Path.Combine(imageRoot.FullName, platform));
                satelliteFolder.CreateDirIfNotExists();
                var yearFolder = new DirectoryInfo(Path.Combine(satelliteFolder.FullName, date.Year.ToString()));
                yearFolder.CreateDirIfNotExists();
                var monthFolder = new DirectoryInfo(Path.Combine(yearFolder.FullName, date.Month.ToString()));
                monthFolder.CreateDirIfNotExists();
                var dayFolder = new DirectoryInfo(Path.Combine(monthFolder.FullName, GetDayDirName(date)));
                dayFolder.CreateDirIfNotExists();

                if (platform.ToLower() == "quickbird" || platform.ToLower() == "worldview" || platform.ToLower() == "re")
                {
                    string cvPath = imagePath;
                    if (platform.ToLower() == "re")
                    {
                        cvPath = Path.ChangeExtension(imagePath, ".tiff");
                    }

                    try
                    {
                        File.WriteAllBytes(cvPath, imageContent);
                        ProcessStartInfo psi =
                            ProcessUtil.CreatePsi(ConfigurationManager.AppSettings["ImageConverterPath"], string.Format("-of PNG {0} {1}", cvPath, imagePath));
                        bool res = Process.Start(psi).WaitForExit(10 * 1000);
                        if (res == false) throw new ApplicationException("Ошибка при преобразование png/tiff --> jpg.");
                        return File.ReadAllBytes(imagePath);
                    }
                    finally
                    {
                        File.Delete(cvPath);
                    }
                }
                else
                    File.WriteAllBytes(imagePath, imageContent);

                return imageContent;
            }
            else {
                return null;
            }

        }
        catch (Exception ex)
        {
            Trace.TraceError(ex.ToString());
            return imageContent ?? ReadImage(url);
        }
    }

    byte[] ReadImage(string url) {
        var client = new WebClient();
        client.Proxy = new WebProxy("192.168.4.10", 8080);
        client.UseDefaultCredentials = true;
        client.Headers.Add (HttpRequestHeader.AcceptLanguage, "ru,en-US;q=0.8,en;q=0.6");
        client.Headers.Add (HttpRequestHeader.Accept, "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
        client.Headers.Add(HttpRequestHeader.UserAgent, "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36");
        return client.DownloadData(url);
    }

    Quicklook GetQuicklook(string sceneid, string platform)
    {
        var data = new[] {
            new RequestParam("WrapStyle","message"),
            new RequestParam("layer", ConfigurationManager.AppSettings["VectorLayerID"]),
            new RequestParam("query", string.IsNullOrEmpty(platform) ? string.Format("sceneid = '{0}'", sceneid) : string.Format("sceneid = '{0}' AND platform = '{1}'", sceneid, platform)),
            new RequestParam("geometry", "false"),
            new RequestParam("page", "0"),
            new RequestParam("count", "add"),
            new RequestParam("pagesize", "1"),
            new RequestParam("columns", "[{'Value':'sceneid'},{'Value':'platform'},{'Value':'acqdate'},{'Value':'stereo'},{'Value':'cloudness'},{'Value':'tilt'},{'Value':'url'}]"),
            new RequestParam("CallbackName", "id0")
        };
        string[] proxyAdress = ConfigurationManager.AppSettings["Proxy"].Split (':');
        int proxyPort = 8080;
        if (proxyAdress.Length == 2 && Int32.TryParse(proxyAdress[1], out proxyPort))
        {
            string proxyHost = proxyAdress[0];
            var jo = GmxUtil.SendPostRequest("http://maps.kosmosnimki.ru/VectorLayer/Search.ashx", new WebProxy(proxyHost, proxyPort), data);
            var values = jo["Result"]["values"].FirstOrDefault<JToken>();
            if (values != null)
            {
                var fields = jo["Result"]["fields"].Select(x => x.Value<string>()).ToArray();
                return values.Select((x, i) => new { v = x.Value<object>(), i })
                .Aggregate(new Quicklook(), (a, x) =>
                {
                    a.Add(fields[x.i], x.v);
                    return a;
                });
            }
            else {
                return null;
            }
        }
        else {
            Trace.TraceError("No proxy defined");
            return null;
        }
    }

    public void ProcessRequest(HttpContext context)
    {
        if (!string.IsNullOrEmpty(context.Request.Headers["Origin"])) {
            context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
            context.Response.Headers["Access-Control-Allow-Origin"] = context.Request.Headers["Origin"];
        }
        context.Response.Expires = 1440; //1 day
        string sceneid = context.Request.GetValue("sceneid");
        if (string.IsNullOrEmpty (sceneid)) {
            sceneid = context.Request.GetValue("id");
        }
        string platform = context.Request.GetValue("platform");
        var q = GetQuicklook(sceneid, platform);

        if (q != null)
        {
            var url = q["url"].ToString();
            if (string.IsNullOrEmpty(platform)) {
                platform = q["platform"].ToString();
            }
            var acqdate = FromUnixDate(Convert.ToDouble(q["acqdate"]) * 1000);
            try {
                Trace.TraceInformation("Getting image url={0}", url);
                var img = GetImage(sceneid, platform, acqdate, url);
                if (img != null) {
                    int width = 0;
                    int height = 0;
                    bool full = false;
                    if (Int32.TryParse(context.Request.GetValue("width"), out width) && Int32.TryParse(context.Request.GetValue("height"), out height))
                    {
                        var src = new MemoryStream();
                        src.Write(img, 0, img.Length);
                        src.Seek(0, SeekOrigin.Begin);
                        var dst = new MemoryStream();
                        ScaleImage(src, dst, width, height);
                        context.Response.WriteImage(dst.ToArray());
                    }
                    else if (Int32.TryParse(context.Request.GetValue("size"), out width))
                    {
                        var src = new MemoryStream();
                        src.Write(img, 0, img.Length);
                        src.Seek(0, SeekOrigin.Begin);
                        var dst = new MemoryStream();
                        ScaleImage(src, dst, width, width);
                        context.Response.WriteImage(dst.ToArray());
                    }
                    else if (bool.TryParse(context.Request.GetValue("full"), out full) && full) {
                        context.Response.WriteImage(img);
                    }
                    else {
                        var src = new MemoryStream();
                        src.Write(img, 0, img.Length);
                        src.Seek(0, SeekOrigin.Begin);
                        var dst = new MemoryStream();
                        ScaleImage(src, dst, 600, 600);
                        context.Response.WriteImage(dst.ToArray());
                    }
                }
            }
            catch (Exception ex) {
                Trace.TraceError("Failed to get image url={0}, {1}", url, ex);
            }
        }
    }

    public bool IsReusable
    {
        get { return false; }
    }
}
