package com.chukie99.kspmobile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale

class RiwayatAdapter(private val items: List<Simpanan>) : RecyclerView.Adapter<RiwayatAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvJenis: TextView = view.findViewById(R.id.tvJenis)
        val tvTanggal: TextView = view.findViewById(R.id.tvTanggal)
        val tvNominal: TextView = view.findViewById(R.id.tvNominal)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_riwayat, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]

        val jenisText = when (item.jenis) {
            "pokok" -> "Simpanan Pokok"
            "wajib" -> "Simpanan Wajib"
            "sukarela" -> "Simpanan Sukarela"
            else -> item.jenis
        }

        holder.tvJenis.text = jenisText
        holder.tvNominal.text = "+Rp ${item.nominal.toLong().toLocaleString()}"

        try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("dd MMM yyyy", Locale("id", "ID"))
            val date = inputFormat.parse(item.created_at)
            holder.tvTanggal.text = if (date != null) outputFormat.format(date) else item.created_at
        } catch (e: Exception) {
            holder.tvTanggal.text = item.created_at
        }
    }

    override fun getItemCount() = items.size

    private fun Long.toLocaleString(): String {
        val format = NumberFormat.getNumberInstance(Locale("id", "ID"))
        return format.format(this)
    }
}
