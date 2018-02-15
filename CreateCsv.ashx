<%@ WebHandler Language="C#" Class="CreateCsv" Debug="true" %>

using System;
using System.Web;
using System.IO;
using CommonWebUtil;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CreateCsv : IHttpHandler, System.Web.SessionState.IRequiresSessionState
{
    public void ProcessRequest(HttpContext context) {
        HttpRequest req = context.Request;
        context.Response.Clear();
        context.Response.ContentType = "text/csv";
        context.Response.AddHeader("content-disposition", string.Format("attachment; filename={0}.csv", req.GetValue("file")));
        using (StreamWriter writer = new StreamWriter(context.Response.OutputStream, Encoding.UTF8)) {
            JArray items = JArray.Parse (req.GetValue("items"));
            var stb = new StringBuilder();
            if (items.Count > 0)
            {
                stb.AppendLine(req.GetValue("columns").Replace(',', '\t'));
                foreach (var line in items)
                {
                    stb.AppendLine(string.Join("\t", line.Values<string>()));
                }
                writer.Write(stb.ToString());
            }
        }
        context.Response.End();
    }
    public bool IsReusable
    {
        get { return false; }
    }
}