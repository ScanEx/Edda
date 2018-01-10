<%@ WebHandler Language="C#" Class="SearchByID" %>

using System;
using System.Web;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Npgsql;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using CommonWebUtil;

public class SearchByID : IHttpHandler
{
    
    static string[] fields = new[] {"sceneid", "acqdate", "acqtime", "cloudness", "tilt", "sunelev", "stereo", "url", "x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4", "volume", "platform", "spot5_a_exists", "spot5_b_exists", "islocal", "product", "gmx_id", "sensor", "local_exists", "spot5id", "stidx", "geomixergeojson"};
    static string[] types = new[] {"string", "date", "time", "float", "float", "float", "string", "string", "float", "float", "float", "float", "float", "float", "float", "float", "string", "string", "boolean", "boolean", "boolean", "boolean", "integer", "string", "boolean", "string", "integer", "geometry"};

    public void ProcessRequest(HttpContext context)
    {
        try
        {
            var jo = new JObject();
            jo["fields"] = new JArray(fields.Take(27));
            jo["types"] = new JArray(types.Take(27));
            jo["values"] = new JArray();
            jo["Count"] = 0;

            var ids = new List<string>();
            foreach (string k in context.Request.Files)
            {
                var f = context.Request.Files[k] as HttpPostedFile;
                using (var sr = new StreamReader(f.InputStream))
                {
                    while (!sr.EndOfStream)
                    {
                        ids.Add(sr.ReadLine());
                    }
                }
            }

            if (ids.Any())
            {
                var kvs = GetKeyValues(ids);

                using (var con = new NpgsqlConnection(ConfigurationManager.ConnectionStrings["Catalog"].ConnectionString))
                {
                    string stm = string.Format("SELECT {0}, st_asgeojson(st_astext(wkb_geometry)) geomixergeojson FROM dbo.\"cat_img\" WHERE sceneid IN({1})", string.Join(", ", fields.Take(27)), string.Join(",", kvs.Keys));

                    con.Open();
                    using (var cmd = new NpgsqlCommand(stm, con))
                    {
                        foreach (var kv in kvs)
                        {
                            cmd.Parameters.AddWithValue(kv.Key, kv.Value);
                        }

                        using (var rd = cmd.ExecuteReader())
                        {
                            var values = new JArray();
                            while (rd.Read())
                            {
                                var ja = fields.Aggregate(new JArray(), (a, f) =>
                                {
                                    var i = rd.GetOrdinal(f);
                                    if (!rd.IsDBNull(i))
                                    {
                                        switch (rd.GetFieldDbType(i))
                                        {
                                            case DbType.String:
                                                switch (f)
                                                {
                                                    case "geomixergeojson":
                                                        try
                                                        {
                                                            a.Add(JObject.Parse(rd.GetString(i)));
                                                        }
                                                        catch (Exception ex) {
                                                            a.Add(null);
                                                        }
                                                        break;
                                                    default:
                                                        var v = rd.GetString(i);
                                                        a.Add(new JValue(v));
                                                        break;
                                                }
                                                break;
                                            case DbType.Int32:
                                                a.Add(new JValue(rd.GetInt32(i)));
                                                break;
                                            case DbType.Double:
                                                a.Add(new JValue(rd.GetDouble(i)));
                                                break;
                                            case DbType.Date:
                                                a.Add(new JValue(rd.GetDate(i).ToString()));
                                                break;
                                            case DbType.Time:
                                                a.Add(new JValue(rd.GetTime(i).ToString()));
                                                break;
                                            case DbType.Boolean:
                                                a.Add(new JValue(rd.GetBoolean(i)));
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                    else
                                    {
                                        a.Add(null);
                                    }
                                    return a;
                                });
                                values.Add(ja);
                            }
                            jo["values"] = values;
                            jo["Count"] = values.Count;
                        }
                    }
                }
            }
            JsonResponse.WriteResultToResponse(jo, context);
        }
        catch (Exception ex)
        {

            JsonResponse.WriteExceptionToResponse(ex, context);
        }
    }

    Dictionary<string, string> GetKeyValues(IEnumerable<string> values)
    {
        return Enumerable
            .Range(0, values.Count())
            .Select(x => string.Format("@p{0}", x))
            .Zip(values, (k, v) => new { k, v })
            .ToDictionary(kv => kv.k, kv => kv.v);
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}