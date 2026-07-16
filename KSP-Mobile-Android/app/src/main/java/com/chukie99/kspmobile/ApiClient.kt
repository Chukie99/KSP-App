package com.chukie99.kspmobile

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

object ApiClient {
    // Ganti dengan URL dan Key Supabase kamu
    const val SUPABASE_URL = "https://your-project.supabase.co"
    const val SUPABASE_KEY = "your-anon-key"

    private val client = OkHttpClient()

    fun get(path: String, callback: (String?, String?) -> Unit) {
        val request = Request.Builder()
            .url("$SUPABASE_URL/rest/v1/$path")
            .addHeader("apikey", SUPABASE_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
            .addHeader("Content-Type", "application/json")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null, e.message)
            }
            override fun onResponse(call: Call, response: Response) {
                callback(response.body?.string(), null)
            }
        })
    }

    fun post(path: String, body: JSONObject, callback: (String?, String?) -> Unit) {
        val requestBody = body.toString()
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("$SUPABASE_URL/rest/v1/$path")
            .addHeader("apikey", SUPABASE_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
            .addHeader("Content-Type", "application/json")
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(null, e.message)
            }
            override fun onResponse(call: Call, response: Response) {
                callback(response.body?.string(), null)
            }
        })
    }
}
