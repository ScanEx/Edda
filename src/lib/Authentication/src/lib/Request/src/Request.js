let uniqueGlobalName = (() => {
    let freeid = 0;
    return thing => {
        let id = `gmx_unique_${freeid++}`;
        window[id] = thing;
        return id;
    };
})();


/** Посылает кросс-доменный GET запрос к серверу с использованием транспорта JSONP.
 *
 * @memberOf nsGmx.Utils
 * @param {String} url URL сервера.
 * @param {Function} callback Ф-ция, которая будет вызвана при получении от сервера результата.
 * @param {String} [callbackParamName=CallbackName] Имя параметра для задания имени ф-ции ответа.
 * @param {Function} [errorCallback] Ф-ция, которая будет вызвана в случае ошибки запроса к серверу
 */
function sendCrossDomainJSONRequest(url, callback, callbackParamName, errorCallback)
{
	callbackParamName = callbackParamName || 'CallbackName';

    let script = document.createElement("script");
	script.setAttribute("charset", "UTF-8");
	let callbackName = uniqueGlobalName((obj) => {
		callback && callback(obj);
		window[callbackName] = false;
		document.getElementsByTagName("head").item(0).removeChild(script);
	});

    let sepSym = url.indexOf('?') == -1 ? '?' : '&';

    if (errorCallback) {
        script.onerror = errorCallback;
    }

	script.setAttribute("src", `${url}${sepSym}${callbackParamName}=${callbackName}&${Math.random()}`);
	document.getElementsByTagName("head").item(0).appendChild(script);
}

export { sendCrossDomainJSONRequest };