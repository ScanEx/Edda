<%@ WebHandler Language="C#" Class="GetMetadata" %>

using System;
using CommonWebUtil;
using System.Web;
using System.Linq;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Npgsql;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Xml;
using System.Globalization;
using System.Diagnostics;
using Field = System.Tuple<string, string, string>;

public class GetMetadata : IHttpHandler
{

    CultureInfo formatProvider = CultureInfo.InvariantCulture;
    public void ProcessRequest(HttpContext context)
    {
        string query_id = context.Request.GetValue("ids");
        if (!string.IsNullOrEmpty(query_id))
        {
            var ids = query_id.Split(',');
            var ips = GetImagesByPlatform(ids);
            var jo = new JObject();

            var dict = new Dictionary<string, List<JObject>>();
            foreach (var kv in ips)
            {
                var platform = kv.Key;
                var tm = GetTableMetadata(platform);
                var file = GetArchiveFileName(platform);
                List<JObject> images = null;
                if (!dict.TryGetValue(file, out images))
                {
                    images = new List<JObject>();
                    dict.Add(file, images);
                }
                var tt = GetTableName(platform);
                var platform_field = GetPlatformField(tt);

                foreach (var sceneid in kv.Value) {
                    images.AddRange(GetImagesMetadata(tm.Item1, tm.Item2, platform_field, platform, sceneid));
                }
            }

            foreach (var kv in dict)
            {
                var ja = kv.Value.Aggregate(new JArray(), (a, x) =>
                {
                    a.Add(x);
                    return a;
                });
                jo.Add(kv.Key, ja);
            }
            JsonResponse.WriteResultToResponse(jo, context);
        }
        else
        {
            JsonResponse.WriteResultToResponse("", context);
        }
    }

    string GetArchiveFileName(string platform)
    {
        Trace.TraceInformation(platform);
        switch (platform)
        {
            case "EROS-A1":
            case "EROS-B":
            case "EROS-A1_L":
            case "EROS-B_L":
                return "EROS";
            case "IK-2":
            case "IK-2_L":
                return "IKONOS";
            case "KOMPSAT2":
            case "KOMPSAT3":
            case "KOMPSAT3A":
                return "KOMPSAT";
            case "LANDSAT_8":
            case "LANDSAT_8_L":
                return "LANDSAT 8";
            case "PHR1A":
            case "PHR1B":
                return "PLEIADES";
            case "1A_PM":
            case "1B_PM":
            case "1A_PM_L":
            case "1B_PM_L":
            case "PHR1A_L":
            case "PHR1B_L":
            case "PHR-1A_L":
            case "PHR-1B_L":
                return "PLEIADES_L";
            case "RE":
                return "RAPIDEYE";
            case "SPOT 5":
                return "SPOT5";
            case "SPOT 5_L":
                return "SPOT5_L";
            case "SPOT6":
            case "SPOT7":
                return "SPOT-6_7";
            case "SPOT 6":
            case "SPOT 7":
            case "SPOT6_L":
            case "SPOT 6_L":
            case "SPOT7_L":
            case "SPOT 7_L":
                return "SPOT-6_7_L";
            case "SPOT-6":
            case "SPOT-7":
            case "SPOT-6_L":
            case "SPOT-7_L":
                return "SPOT-6_7_products";
            case "WV01":
            case "WV01_L":
                return "WV1";
            case "GE01":
            case "GE-1":
            case "QB02":
            case "WV02":
            case "WV03":
            case "WV04":
                return "DG_products";
            case "GE01_L":
            case "QB02_L":
            case "WV02_L":
            case "WV03_L":
            case "WV04_L":
                return "DG_products_L";
            case "BKA":
                return "BKA";
            case "GF1":
            case "GF2":
            case "ZY3":
                return "GF_ZY";
            case "Ресурс-П1":
            case "Ресурс-П2":
            case "Ресурс-П3":
                return "Resurs-P";
            case "1A-PHR-1A_L":
            case "1A-PHR-1B_L":
            case "1A-SPOT-6_L":
            case "1A-SPOT-7_L":
                return "ONE_ATLAS";
            case "TripleSat Constellation-1":
            case "TripleSat Constellation-2":
            case "TripleSat Constellation-3":
                return "TRIPLESAT";
            case "GJ1A":
            case "GJ1B":
            case "GJ1C":
            case "GJ1D":
                return "SV1";
            default:
                return null;
        }
    }

    string GetTableName(string platform)
    {
        switch (platform)
        {
            case "EROS-A1":
            case "EROS-B":
            case "EROS-A1_L":
            case "EROS-B_L":
            case "SPOT 5_L":
            case "SPOT 6":
            case "SPOT6_L":
            case "SPOT 7":
            case "SPOT7_L":
            case "SPOT 6_L":
            case "SPOT 7_L":
                return "eros";
            case "SPOT-6":
            case "SPOT-7":
            case "SPOT-6_L":
            case "SPOT-7_L":
                return "sp67_prod";
            case "IK-2":
            case "IK-2_L":
                return "ik";
            case "KOMPSAT2":
            case "KOMPSAT3":
            case "KOMPSAT3A":
                return "k3";
            case "LANDSAT_8":
                return "ls8";
            case "1A_PM":
            case "1B_PM":
            case "PHR1A":
            case "PHR1B":
            case "PHR1A_L":
            case "PHR1B_L":
            case "SPOT6":
            case "SPOT7":
            case "1A_PM_L":
            case "1B_PM_L":
                return "ast";
            case "PHR-1A_L":
            case "PHR-1B_L":
                return "phr";
            case "RE":
                return "re";
            case "SPOT 5":
                return "sp5";
            case "GE01":
            case "GE-1":
            case "QB02":
            case "WV01":
            case "WV02":
            case "WV03":
            case "WV04":
                return "dg";
            case "GE01_L":
            case "QB02_L":
            case "WV01_L":
            case "WV02_L":
            case "WV03_L":
            case "WV04_L":
                return "dg_a";
            case "BKA":
                return "bka";
            case "GF1":
            case "GF2":
            case "ZY3":
                return "gf";
            case "Ресурс-П1":
            case "Ресурс-П2":
            case "Ресурс-П3":
                return "resource";
            case "1A-PHR-1A_L":
            case "1A-PHR-1B_L":
            case "1A-SPOT-6_L":
            case "1A-SPOT-7_L":
                return "one_atlas";
            case "TripleSat Constellation-1":
            case "TripleSat Constellation-2":
            case "TripleSat Constellation-3":
                return "triplesat";
            case "GJ1A":
            case "GJ1B":
            case "GJ1C":
            case "GJ1D":
                return "sv";
            default:
                return null;

        }
    }

    string GetIDField(string table)
    {
        switch (table)
        {
            case "ast":
                return "datastrip";
            case "dg":
                return "catalogid";                            
            case "dg_a":
            case "ik":
            case "phr":
            case "one_atlas":
            case "sp67_prod":
                return "scene_id";
            case "k3":
                return "productid";
            case "eros":                
            case "sv":
            case "ls8":
                return "sceneid";
            case "re":
                return "catid";
            case "sp5":
                return "a21";
            case "bka":
                return "id";
            case "gf":
                return "jh";
            case "resource":
                return "metadata_id";            
            case "triplesat":
                return "id";                            
            default:
                return null;
        }
    }

    string GetPlatformField(string table)
    {
        switch (table)
        {
            case "ast":
                return "satel";
            case "dg":
            case "eros":
                return "platform";
            case "dg_a":
            case "phr":
            case "bka":
            case "one_atlas":
            case "triplesat":
            case "sp67_prod":
                return "satellite";
            case "ik":
                return "source_abr";
            case "gf":
                return "satellitei";
            case "sv":
                return "satelliteid";
            default:
                return null;
        }
    }

    Tuple<string, string> GetTableMetadata(string platform)
    {
        string table = GetTableName(platform);
        if (!string.IsNullOrEmpty(table))
        {
            string id_field = GetIDField(table);
            if (!string.IsNullOrEmpty(id_field))
            {
                return new Tuple<string, string>(table, id_field);
            }
        }
        return null;
    }

    JObject GetCommonMetadata(string sceneid, string platform)
    {
        JObject res = null;
        using (var con = new NpgsqlConnection(ConfigurationManager.ConnectionStrings["Catalog"].ConnectionString))
        {
            //string stm = "SELECT sceneid id, platform sat_name, acqdate date, url, x1, y1, x2, y2, x3, y3, x4, y4 FROM dbo.cat_img WHERE sceneid = @sceneid";

            string stm = platform.Contains("_L") ?
                    "SELECT url, x1, y1, x2, y2, x3, y3, x4, y4, st_asgeojson(st_astext(wkb_geometry)) geomixergeojson FROM dbo.cat_img WHERE sceneid = @sceneid" :
                    "SELECT url, x1, y1, x2, y2, x3, y3, x4, y4, st_asgeojson(st_astext(wkb_geometry)) geomixergeojson FROM dbo.cat_img WHERE sceneid = @sceneid AND platform = @platform";

            con.Open();
            using (var cmd = new NpgsqlCommand(stm, con))
            {
                cmd.Parameters.AddWithValue("@sceneid", sceneid);
                if (!platform.Contains("_L"))
                {
                    cmd.Parameters.AddWithValue("@platform", platform);
                }

                var rd = cmd.ExecuteReader();

                rd.Read();

                res = Enumerable.Range(0, rd.FieldCount).Aggregate(new JObject(), (a, i) =>
                {
                    if (!rd.IsDBNull(i))
                    {
                        var f = rd.GetName(i);
                        switch (rd.GetFieldDbType(i))
                        {
                            case DbType.String:
                                switch (f)
                                {
                                    case "geomixergeojson":
                                        a.Add("geometry", JObject.Parse(rd.GetString(i)));
                                        break;
                                    default:
                                        a.Add(f, new JValue(rd.GetString(i)));
                                        break;
                                }
                                break;
                            case DbType.Int32:
                                a.Add(f, new JValue(rd.GetInt32(i)));
                                break;
                            case DbType.Double:
                                a.Add(f, new JValue(rd.GetDouble(i)));
                                break;
                            case DbType.Date:
                                a.Add(f, new JValue(rd.GetDate(i).ToString()));
                                break;
                            default:
                                break;
                        }
                    }
                    return a;
                });


            }
        }
        return res;
    }

    IEnumerable<JObject> GetImagesMetadata(string table, string id_field, string platform_field, string platform, string sceneid)
    {
        var list = new List<JObject>();
        using (var con = new NpgsqlConnection(ConfigurationManager.ConnectionStrings["Catalog"].ConnectionString))
        {
            string stm = string.IsNullOrEmpty (platform_field) || platform.Contains("_L") ?
                    string.Format("SELECT * FROM dbo.\"{0}\" WHERE \"{1}\" =  '{2}'", table, id_field, sceneid) :
                    string.Format("SELECT * FROM dbo.\"{0}\" WHERE \"{1}\" = '{2}' AND \"{3}\" = '{4}'", table, id_field, sceneid, platform_field, platform);

            con.Open();
            using (var cmd = new NpgsqlCommand(stm, con))
            {
                var rd = cmd.ExecuteReader();

                while (rd.Read())
                {
                    var jt = Enumerable.Range(0, rd.FieldCount).Aggregate(new JObject(), (a, i) =>
                    {
                        if (!rd.IsDBNull(i))
                        {
                            var f = rd.GetName(i);
                            switch (rd.GetFieldDbType(i))
                            {
                                case DbType.Object:
                                    if (table == "resource")
                                    {
                                        var jo = JObject.Parse (rd.GetString(i));
                                        var fields = new Dictionary<string, string>() {
                                            { "row_number", "integer" },
                                            { "row_count", "integer" },
                                            { "metadata_id", "integer" },
                                            { "last_modified", "date" },
                                            { "file_identifier", "string" },
                                            { "resolution", "float" },
                                            { "abstract", "string" },
                                            { "date_instant", "date" },
                                            { "date_begin", "date" },
                                            { "date_end", "date" },
                                            { "polygon", "string" },
                                            { "cloudiness", "float" },
                                            { "access_open", "boolean" },
                                            { "platform_id", "integer" },
                                            { "circuit_number", "integer" },
                                            { "scan_number", "integer" },
                                            { "access_order", "boolean" },
                                            { "platform", "string" },
                                            { "metadata_xml", "string" },
                                            { "metadata_full", "string" },
                                            { "order_url", "string" },
                                        };
                                        foreach (var t in fields)
                                        {
                                            switch (t.Value) {
                                                case "integer":
                                                    a[t.Key] = new JValue (jo[t.Key].Value<int>());
                                                    break;
                                                case "float":
                                                    a[t.Key] = new JValue (jo[t.Key].Value<double>());
                                                    break;
                                                case "date":
                                                    a[t.Key] = new JValue (jo[t.Key].Value<DateTime?>());
                                                    break;
                                                case "boolean":
                                                    a[t.Key] = new JValue (jo[t.Key].Value<bool>());
                                                    break;
                                                default:
                                                case "string":
                                                    a[t.Key] = new JValue (jo[t.Key].Value<string>());
                                                    break;
                                            }
                                        }
                                    }
                                    break;
                                case DbType.String:
                                    switch (f)
                                    {
                                        case "wkb":
                                            break;
                                        default:
                                            var v = rd.GetString(i);
                                            if (a.Property(f) == null)
                                            {
                                                a.Add(f, new JValue(v));
                                            }
                                            if (f == id_field)
                                            {
                                                var cm = GetCommonMetadata(v, platform);
                                                a.Merge(cm);
                                            }
                                            break;
                                    }
                                    break;
                                case DbType.Int32:
                                    var z = rd.GetInt32(i);
                                    if (a.Property(f) == null)
                                    {
                                        a.Add(f, new JValue(z));
                                    }
                                    if (f == id_field)
                                    {
                                        var cm = GetCommonMetadata(z.ToString(), platform);
                                        a.Merge(cm);
                                    }
                                    break;
                                case DbType.Double:
                                    if (a.Property(f) == null)
                                    {
                                        a.Add(f, new JValue(rd.GetDouble(i)));
                                    }
                                    break;
                                case DbType.Date:
                                    if (a.Property(f) == null)
                                    {
                                        a.Add(f, new JValue(rd.GetDate(i).ToString()));
                                    }
                                    break;
                                case DbType.DateTime:
                                    if (a.Property(f) == null)
                                    {
                                        a.Add(f, new JValue(rd.GetDateTime(i).ToString()));
                                    }
                                    break;
                                case DbType.Xml:
                                    if (table == "k3")
                                    {
                                        var xd = new XmlDocument();
                                        xd.LoadXml(rd.GetString(i));
                                        var ns = new XmlNamespaceManager(xd.NameTable);
                                        ns.AddNamespace("ns2", "http://earth.esa.int/XML/eoli");
                                        var fields = new[] {
                                            new Field("platfSNm", "//ns2:dataIdInfo/ns2:plaInsId/ns2:platfSNm", "string"),
                                            new Field("platfSer", "//ns2:dataIdInfo/ns2:plaInsId/ns2:platfSer", "string"),
                                            new Field("orbit", "//ns2:dataIdInfo/ns2:satDom/ns2:orbit", "integer"),
                                            new Field("orbitDir", "//ns2:dataIdInfo/ns2:satDom/ns2:orbitDir", "integer"),
                                            new Field("frame", "//ns2:dataIdInfo/ns2:satDom/ns2:wwRefSys/ns2:frame", "integer"),
                                            new Field("track", "//ns2:dataIdInfo/ns2:satDom/ns2:wwRefSys/ns2:track", "integer"),
                                            new Field("resTitle", "//ns2:dataIdInfo/ns2:idCitation/ns2:resTitle", "string"),
                                            new Field("begin", "//ns2:dataIdInfo/ns2:dataExt/ns2:tempEle/ns2:exTemp/ns2:beginEnd/ns2:begin", "date"),
                                            new Field("end", "//ns2:dataIdInfo/ns2:dataExt/ns2:tempEle/ns2:exTemp/ns2:beginEnd/ns2:end", "date"),
                                            new Field("cloudCovePerc", "//ns2:contInfo/ns2:cloudCovePerc", "float"),
                                            new Field("bgFileName", "//ns2:dqInfo/ns2:graphOver/ns2:bgFileName", "string"),
                                            new Field("offNadirAngle", @"//ns2:addInfo/ns2:locAtt/ns2:locName[text()=""offNadirAngle""]/following-sibling::ns2:locValue", "float"),
                                                };
                                        foreach (var t in FromXml(xd, ns, fields))
                                        {
                                            a.Add(t.Item1, new JValue(t.Item2));
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        return a;
                    });

                    list.Add(jt);
                }
            }
        }

        return list;
    }

    IEnumerable<Tuple<string, object>> FromXml(XmlDocument xd, XmlNamespaceManager ns, IEnumerable<Field> fields)
    {
        foreach (var x in fields)
        {
            var n = xd.SelectSingleNode(x.Item2, ns);
            if (n != null)
            {
                var t = n.InnerText;
                switch (x.Item3)
                {
                    case "date":
                        yield return new Tuple<string, object>(x.Item1, DateTime.Parse(t));
                        break;
                    case "float":
                        var v = double.Parse(t, this.formatProvider);
                        yield return new Tuple<string, object>(x.Item1, x.Item1 == "cloudCovePerc" ? v * 10 : v);
                        break;
                    case "integer":
                        yield return new Tuple<string, object>(x.Item1, int.Parse(t));
                        break;
                    case "string":
                    default:
                        yield return new Tuple<string, object>(x.Item1, t);
                        break;
                }
            }
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

    Dictionary<string, List<string>> GetImagesByPlatform(string[] ids)
    {
        var dict = new Dictionary<string, List<string>>();
        foreach (var id in ids) {
            var parts = id.Split(';');
            string key = string.Concat(parts[1], Boolean.Parse (parts[2]) ? "_L" : "");
            List<string> list = null;
            if (!dict.TryGetValue(key, out list))
            {
                list = new List<string>();
                dict.Add(key, list);
            }
            list.Add(parts[0]);
        }

        return dict;
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}