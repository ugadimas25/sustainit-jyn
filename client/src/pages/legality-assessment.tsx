import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Building,
  Plus,
  Trash2,
  Save,
  FileCheck
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface EstateDataForm {
  // Bagian 1: Informasi Umum
  namaSupplier: string;
  namaGroupParentCompany?: string;
  aktaPendirianPerusahaan?: string;
  aktaPerubahan?: string;
  izinBerusaha?: string;
  tipeSertifikat?: string;
  nomorSertifikat?: string;
  lembagaSertifikasi?: string;
  ruangLingkupSertifikasi?: string;
  masaBerlakuSertifikat?: string;
  linkDokumen?: string;
  
  // Alamat & Koordinat
  alamatKantor?: string;
  alamatKebun?: string;
  koordinatKantor?: string;
  koordinatKebun?: string;
  
  // Jenis Supplier
  jenisSupplier?: string;
  totalProduksiTBS?: string;
  tanggalPengisianKuisioner?: string;
  
  // Penanggung Jawab
  namaPenanggungJawab?: string;
  jabatanPenanggungJawab?: string;
  emailPenanggungJawab?: string;
  nomorTeleponPenanggungJawab?: string;
  
  // Tim Internal
  namaTimInternal?: string;
  jabatanTimInternal?: string;
  emailTimInternal?: string;
  nomorTelefonTimInternal?: string;
  
  // Bagian 2: Sumber TBS
  sumberTBS: Array<{
    no: number;
    namaKebun: string;
    alamat: string;
    luasLahan: number;
    longitude: string;
    latitude: string;
    tahunTanam: string;
    jenisBibit: string;
    produksiTBS: number;
  }>;
  
  // Bagian 3: Perlindungan Hutan dan Gambut
  memilikiKebijakanPerlindunganHutan?: boolean;
  keteranganKebijakanHutan?: string;
  dokumenKebijakanHutan?: string;
  
  mengikutiWorkshopNDPE?: boolean;
  keteranganWorkshopNDPE?: string;
  
  memilikiSOPKonservasi?: boolean;
  memilikiSOPPembukaanLahan?: boolean;
  keteranganSOP?: string;
  
  melakukanPenilaianNKT?: boolean;
  menyampaikanLaporanNKT?: boolean;
  melakukanPenilaianSKT?: boolean;
  keteranganPenilaian?: string;
  
  penanamanDiAreaGambut?: boolean;
  keteranganAreaGambut?: string;
  luasAreaGambut?: number;
  tahunPembukaanGambut?: number;
  
  memilikiSKTitikPenaatan?: boolean;
  keteranganSKTitikPenaatan?: string;
  dokumenSKTitikPenaatan?: string;
}

export default function LegalityAssessmentPage() {
  const [activeTab, setActiveTab] = useState("estate-collection");
  const [estateForm, setEstateForm] = useState<EstateDataForm>({
    namaSupplier: "",
    sumberTBS: [{
      no: 1,
      namaKebun: "",
      alamat: "",
      luasLahan: 0,
      longitude: "",
      latitude: "",
      tahunTanam: "",
      jenisBibit: "",
      produksiTBS: 0
    }]
  });

  // Create estate data collection mutation
  const createEstateDataMutation = useMutation({
    mutationFn: async (data: EstateDataForm) => {
      const response = await fetch('/api/estate-data-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to submit form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      // Reset form after successful submission
      setEstateForm({
        namaSupplier: "",
        sumberTBS: [{
          no: 1,
          namaKebun: "",
          alamat: "",
          luasLahan: 0,
          longitude: "",
          latitude: "",
          tahunTanam: "",
          jenisBibit: "",
          produksiTBS: 0
        }]
      });
    }
  });

  const addSumberTBS = () => {
    setEstateForm(prev => ({
      ...prev,
      sumberTBS: [...prev.sumberTBS, {
        no: prev.sumberTBS.length + 1,
        namaKebun: "",
        alamat: "",
        luasLahan: 0,
        longitude: "",
        latitude: "",
        tahunTanam: "",
        jenisBibit: "",
        produksiTBS: 0
      }]
    }));
  };

  const removeSumberTBS = (index: number) => {
    setEstateForm(prev => ({
      ...prev,
      sumberTBS: prev.sumberTBS.filter((_, i) => i !== index)
    }));
  };

  const updateSumberTBS = (index: number, field: string, value: any) => {
    setEstateForm(prev => ({
      ...prev,
      sumberTBS: prev.sumberTBS.map((source, i) => 
        i === index ? { ...source, [field]: value } : source
      )
    }));
  };

  const handleSubmitEstateForm = () => {
    if (!estateForm.namaSupplier.trim()) {
      alert('Nama Supplier harus diisi');
      return;
    }
    createEstateDataMutation.mutate(estateForm);
  };

  const handleSaveDraft = () => {
    console.log('Saving draft:', estateForm);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Legality Assessment
          </h1>
          <p className="text-gray-600 mt-1">Pengumpulan data untuk kepatuhan EUDR</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estate-collection" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Estate Data Collection
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Assessment
          </TabsTrigger>
        </TabsList>

        {/* Estate Data Collection Tab */}
        <TabsContent value="estate-collection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formulir Pengumpulan Data</CardTitle>
              <p className="text-sm text-gray-600">(Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Bagian 1: Informasi Umum */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama-supplier">Nama Supplier *</Label>
                    <Input 
                      id="nama-supplier" 
                      placeholder="Masukkan nama supplier" 
                      value={estateForm.namaSupplier}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                      data-testid="input-nama-supplier" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama-group-parent">Nama Group / Parent Company Name</Label>
                    <Input 
                      id="nama-group-parent" 
                      placeholder="Masukkan nama group/parent company" 
                      value={estateForm.namaGroupParentCompany || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, namaGroupParentCompany: e.target.value }))}
                      data-testid="input-nama-group-parent" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="akta-pendirian">Akta Pendirian Perusahaan</Label>
                    <Input 
                      id="akta-pendirian" 
                      placeholder="Nomor akta pendirian" 
                      value={estateForm.aktaPendirianPerusahaan || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, aktaPendirianPerusahaan: e.target.value }))}
                      data-testid="input-akta-pendirian" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="akta-perubahan">Akta Perubahan (Jika Ada)</Label>
                    <Input 
                      id="akta-perubahan" 
                      placeholder="Nomor akta perubahan" 
                      value={estateForm.aktaPerubahan || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, aktaPerubahan: e.target.value }))}
                      data-testid="input-akta-perubahan" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="izin-berusaha">Izin Berusaha (Nomor Induk Berusaha)</Label>
                    <Input 
                      id="izin-berusaha" 
                      placeholder="Nomor induk berusaha" 
                      value={estateForm.izinBerusaha || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                      data-testid="input-izin-berusaha" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipe-sertifikat">Tipe Sertifikat Yang Dimiliki Perusahaan</Label>
                    <Select value={estateForm.tipeSertifikat || ""} onValueChange={(value) => setEstateForm(prev => ({ ...prev, tipeSertifikat: value }))}>
                      <SelectTrigger data-testid="select-tipe-sertifikat">
                        <SelectValue placeholder="Pilih sertifikat (ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISPO">ISPO</SelectItem>
                        <SelectItem value="RSPO">RSPO</SelectItem>
                        <SelectItem value="ISCC">ISCC</SelectItem>
                        <SelectItem value="PROPER LINGKUNGAN">PROPER LINGKUNGAN</SelectItem>
                        <SelectItem value="SMK3">SMK3</SelectItem>
                        <SelectItem value="multiple">Multiple Certifications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomor-sertifikat">Nomor Sertifikat</Label>
                    <Input 
                      id="nomor-sertifikat" 
                      placeholder="Nomor sertifikat" 
                      value={estateForm.nomorSertifikat || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                      data-testid="input-nomor-sertifikat" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lembaga-sertifikasi">Lembaga Sertifikasi</Label>
                    <Input 
                      id="lembaga-sertifikasi" 
                      placeholder="Nama lembaga sertifikasi" 
                      value={estateForm.lembagaSertifikasi || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                      data-testid="input-lembaga-sertifikasi" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="masa-berlaku">Masa Berlaku Sertifikat</Label>
                    <Input 
                      id="masa-berlaku" 
                      type="date" 
                      value={estateForm.masaBerlakuSertifikat || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                      data-testid="input-masa-berlaku" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ruang-lingkup">Ruang Lingkup Sertifikasi</Label>
                  <Textarea 
                    id="ruang-lingkup" 
                    placeholder="Deskripsi ruang lingkup sertifikasi" 
                    value={estateForm.ruangLingkupSertifikasi || ""}
                    onChange={(e) => setEstateForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                    data-testid="textarea-ruang-lingkup" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link-dokumen">Link Dokumen</Label>
                  <Input 
                    id="link-dokumen" 
                    placeholder="Link Google Drive atau website" 
                    value={estateForm.linkDokumen || ""}
                    onChange={(e) => setEstateForm(prev => ({ ...prev, linkDokumen: e.target.value }))}
                    data-testid="input-link-dokumen" 
                  />
                </div>
              </div>

              {/* Alamat & Koordinat */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Alamat</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alamat-kantor">Kantor</Label>
                    <Textarea 
                      id="alamat-kantor" 
                      placeholder="Alamat kantor pusat" 
                      value={estateForm.alamatKantor || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                      data-testid="textarea-alamat-kantor" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamat-kebun">Kebun</Label>
                    <Textarea 
                      id="alamat-kebun" 
                      placeholder="Alamat kebun/perkebunan" 
                      value={estateForm.alamatKebun || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                      data-testid="textarea-alamat-kebun" 
                    />
                  </div>
                </div>
                
                <h3 className="text-base font-semibold border-b pb-2">Koordinat</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="koordinat-kantor">Kantor</Label>
                    <Input 
                      id="koordinat-kantor" 
                      placeholder="Lat, Long (contoh: 3.1390, 101.6869)" 
                      value={estateForm.koordinatKantor || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                      data-testid="input-koordinat-kantor" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="koordinat-kebun">Kebun</Label>
                    <Input 
                      id="koordinat-kebun" 
                      placeholder="Lat, Long (contoh: 3.1390, 101.6869)" 
                      value={estateForm.koordinatKebun || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                      data-testid="input-koordinat-kebun" 
                    />
                  </div>
                </div>
              </div>

              {/* Jenis Supplier dan Info Tambahan */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jenis-supplier">Jenis supplier</Label>
                  <Select value={estateForm.jenisSupplier || ""} onValueChange={(value) => setEstateForm(prev => ({ ...prev, jenisSupplier: value }))}>
                    <SelectTrigger data-testid="select-jenis-supplier">
                      <SelectValue placeholder="Pilih jenis supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plasma">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</SelectItem>
                      <SelectItem value="sister">Kebun dalam satu grup manajemen (sister company)</SelectItem>
                      <SelectItem value="third-party">Kebun pihak ketiga (PT/ CV/ Koperasi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total-produksi">Total Produksi TBS / Tahun (kurun 1 tahun terakhir)</Label>
                    <Input 
                      id="total-produksi" 
                      placeholder="Jumlah produksi TBS per tahun" 
                      value={estateForm.totalProduksiTBS || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, totalProduksiTBS: e.target.value }))}
                      data-testid="input-total-produksi" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tanggal-pengisian">Tanggal pengisian kuisioner</Label>
                    <Input 
                      id="tanggal-pengisian" 
                      type="date" 
                      value={estateForm.tanggalPengisianKuisioner || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                      data-testid="input-tanggal-pengisian" 
                    />
                  </div>
                </div>
              </div>

              {/* Penanggung Jawab */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Penanggung Jawab</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama-penanggung-jawab">Nama</Label>
                    <Input 
                      id="nama-penanggung-jawab" 
                      placeholder="Nama penanggung jawab" 
                      value={estateForm.namaPenanggungJawab || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                      data-testid="input-nama-penanggung-jawab" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jabatan-penanggung-jawab">Jabatan</Label>
                    <Input 
                      id="jabatan-penanggung-jawab" 
                      placeholder="Jabatan penanggung jawab" 
                      value={estateForm.jabatanPenanggungJawab || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                      data-testid="input-jabatan-penanggung-jawab" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-penanggung-jawab">Email</Label>
                    <Input 
                      id="email-penanggung-jawab" 
                      type="email" 
                      placeholder="Email penanggung jawab" 
                      value={estateForm.emailPenanggungJawab || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                      data-testid="input-email-penanggung-jawab" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomor-telepon-penanggung-jawab">Nomor Telfon / Handphone</Label>
                    <Input 
                      id="nomor-telepon-penanggung-jawab" 
                      placeholder="Nomor telepon penanggung jawab" 
                      value={estateForm.nomorTeleponPenanggungJawab || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, nomorTeleponPenanggungJawab: e.target.value }))}
                      data-testid="input-nomor-telepon-penanggung-jawab" 
                    />
                  </div>
                </div>
              </div>

              {/* Tim Internal */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama-tim-internal">Nama</Label>
                    <Input 
                      id="nama-tim-internal" 
                      placeholder="Nama tim internal" 
                      value={estateForm.namaTimInternal || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                      data-testid="input-nama-tim-internal" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jabatan-tim-internal">Jabatan</Label>
                    <Input 
                      id="jabatan-tim-internal" 
                      placeholder="Jabatan tim internal" 
                      value={estateForm.jabatanTimInternal || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                      data-testid="input-jabatan-tim-internal" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-tim-internal">Email</Label>
                    <Input 
                      id="email-tim-internal" 
                      type="email" 
                      placeholder="Email tim internal" 
                      value={estateForm.emailTimInternal || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                      data-testid="input-email-tim-internal" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomor-telepon-tim-internal">Nomor Telfon / Handphone</Label>
                    <Input 
                      id="nomor-telepon-tim-internal" 
                      placeholder="Nomor telepon tim internal" 
                      value={estateForm.nomorTelefonTimInternal || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                      data-testid="input-nomor-telepon-tim-internal" 
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Sumber TBS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold border-b pb-2">Bagian 2 – Sumber TBS</h3>
                  <Button variant="outline" size="sm" onClick={addSumberTBS} data-testid="button-add-sumber-tbs">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kebun
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Kebun</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Luas Lahan (Ha)</TableHead>
                        <TableHead>Koordinat * - Longitude</TableHead>
                        <TableHead>Koordinat * - Latitude</TableHead>
                        <TableHead>Tahun Tanam</TableHead>
                        <TableHead>Jenis Bibit</TableHead>
                        <TableHead>Produksi TBS 1 Tahun Terakhir</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estateForm.sumberTBS.map((source, index) => (
                        <TableRow key={index}>
                          <TableCell>{source.no}</TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Nama kebun" 
                              className="min-w-32" 
                              value={source.namaKebun}
                              onChange={(e) => updateSumberTBS(index, 'namaKebun', e.target.value)}
                              data-testid={`input-nama-kebun-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Alamat" 
                              className="min-w-40" 
                              value={source.alamat}
                              onChange={(e) => updateSumberTBS(index, 'alamat', e.target.value)}
                              data-testid={`input-alamat-kebun-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="min-w-20" 
                              value={source.luasLahan}
                              onChange={(e) => updateSumberTBS(index, 'luasLahan', Number(e.target.value))}
                              data-testid={`input-luas-lahan-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="101.6869" 
                              className="min-w-24" 
                              value={source.longitude}
                              onChange={(e) => updateSumberTBS(index, 'longitude', e.target.value)}
                              data-testid={`input-longitude-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="3.1390" 
                              className="min-w-24" 
                              value={source.latitude}
                              onChange={(e) => updateSumberTBS(index, 'latitude', e.target.value)}
                              data-testid={`input-latitude-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="2010" 
                              className="min-w-20" 
                              value={source.tahunTanam}
                              onChange={(e) => updateSumberTBS(index, 'tahunTanam', e.target.value)}
                              data-testid={`input-tahun-tanam-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Bibit bersertifikat" 
                              className="min-w-32" 
                              value={source.jenisBibit}
                              onChange={(e) => updateSumberTBS(index, 'jenisBibit', e.target.value)}
                              data-testid={`input-jenis-bibit-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="min-w-24" 
                              value={source.produksiTBS}
                              onChange={(e) => updateSumberTBS(index, 'produksiTBS', Number(e.target.value))}
                              data-testid={`input-produksi-tbs-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeSumberTBS(index)}
                              disabled={estateForm.sumberTBS.length === 1}
                              data-testid={`button-remove-kebun-${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <p className="text-xs text-gray-500">
                  Keterangan : *) Jika lebih &gt; 4Ha data Polygon (SHP/GeoJSON)
                </p>
              </div>

              {/* Bagian 3: Perlindungan Hutan dan Gambut */}
              <div className="space-y-6">
                <h3 className="text-base font-semibold border-b pb-2">Bagian 3 – Perlindungan Hutan dan Gambut</h3>
                
                {/* 2.1 Kebijakan */}
                <div className="space-y-4">
                  <h4 className="font-medium">2.1 Apakah memiliki kebijakan yang mencakup:</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2">
                        <Label>Perlindungan hutan</Label>
                        <Label>Perlindungan gambut</Label>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="kebijakan-ya" 
                            name="kebijakanPerlindunganHutan" 
                            value="ya" 
                            checked={estateForm.memilikiKebijakanPerlindunganHutan === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiKebijakanPerlindunganHutan: true }))}
                            data-testid="radio-kebijakan-ya" 
                          />
                          <Label htmlFor="kebijakan-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="kebijakan-tidak" 
                            name="kebijakanPerlindunganHutan" 
                            value="tidak" 
                            checked={estateForm.memilikiKebijakanPerlindunganHutan === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiKebijakanPerlindunganHutan: false }))}
                            data-testid="radio-kebijakan-tidak" 
                          />
                          <Label htmlFor="kebijakan-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-kebijakan">Keterangan :</Label>
                      <Textarea 
                        id="keterangan-kebijakan" 
                        placeholder="Keterangan tambahan" 
                        value={estateForm.keteranganKebijakanHutan || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganKebijakanHutan: e.target.value }))}
                        data-testid="textarea-keterangan-kebijakan" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dokumen-kebijakan">Lampirkan Dokumen : (dalam Bentuk Google Drive Jika Kebijakan Tidak Terpublikasi di Website Perusahaan)</Label>
                      <Input 
                        id="dokumen-kebijakan" 
                        placeholder="Link Google Drive" 
                        value={estateForm.dokumenKebijakanHutan || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, dokumenKebijakanHutan: e.target.value }))}
                        data-testid="input-dokumen-kebijakan" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2.2 Workshop NDPE */}
                <div className="space-y-4">
                  <h4 className="font-medium">2.2 Apakah telah mengikuti lokakarya (workshop) terkait komitmen kebijakan NDPE</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="ndpe-ya" 
                            name="mengikutiWorkshopNDPE" 
                            value="ya" 
                            checked={estateForm.mengikutiWorkshopNDPE === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, mengikutiWorkshopNDPE: true }))}
                            data-testid="radio-ndpe-ya" 
                          />
                          <Label htmlFor="ndpe-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="ndpe-tidak" 
                            name="mengikutiWorkshopNDPE" 
                            value="tidak" 
                            checked={estateForm.mengikutiWorkshopNDPE === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, mengikutiWorkshopNDPE: false }))}
                            data-testid="radio-ndpe-tidak" 
                          />
                          <Label htmlFor="ndpe-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-ndpe">Keterangan :</Label>
                      <Textarea 
                        id="keterangan-ndpe" 
                        placeholder="Detail workshop NDPE" 
                        value={estateForm.keteranganWorkshopNDPE || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganWorkshopNDPE: e.target.value }))}
                        data-testid="textarea-keterangan-ndpe" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2.3 SOP */}
                <div className="space-y-4">
                  <h4 className="font-medium">2.3 Apakah memiliki prosedur yang menunjukan perlindungan hutan</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Apakah Perusahaan memiliki SOP identifikasi Pengelolaan Area Konservasi (Nilai Konservasi Tinggi/NKT dan Stock Karbon Tinggi/SKT)</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="sop-konservasi-ya" 
                            name="memilikiSOPKonservasi" 
                            value="ya" 
                            checked={estateForm.memilikiSOPKonservasi === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiSOPKonservasi: true }))}
                            data-testid="radio-sop-konservasi-ya" 
                          />
                          <Label htmlFor="sop-konservasi-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="sop-konservasi-tidak" 
                            name="memilikiSOPKonservasi" 
                            value="tidak" 
                            checked={estateForm.memilikiSOPKonservasi === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiSOPKonservasi: false }))}
                            data-testid="radio-sop-konservasi-tidak" 
                          />
                          <Label htmlFor="sop-konservasi-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Apakah Perusahaan memiliki SOP Pembukaan lahan, Konservasi tanah dan air.</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="sop-pembukaan-ya" 
                            name="memilikiSOPPembukaanLahan" 
                            value="ya" 
                            checked={estateForm.memilikiSOPPembukaanLahan === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiSOPPembukaanLahan: true }))}
                            data-testid="radio-sop-pembukaan-ya" 
                          />
                          <Label htmlFor="sop-pembukaan-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="sop-pembukaan-tidak" 
                            name="memilikiSOPPembukaanLahan" 
                            value="tidak" 
                            checked={estateForm.memilikiSOPPembukaanLahan === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiSOPPembukaanLahan: false }))}
                            data-testid="radio-sop-pembukaan-tidak" 
                          />
                          <Label htmlFor="sop-pembukaan-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-sop">Keterangan :</Label>
                      <Textarea 
                        id="keterangan-sop" 
                        placeholder="Keterangan SOP" 
                        value={estateForm.keteranganSOP || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganSOP: e.target.value }))}
                        data-testid="textarea-keterangan-sop" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2.4 Bukti Pelaksanaan */}
                <div className="space-y-4">
                  <h4 className="font-medium">2.4 Berikan Bukti Pelaksanaan prosedur point 2.3. diatas</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Apakah melakukan Penilaian Nilai Konservasi Tinggi?</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="nkt-ya" 
                            name="melakukanPenilaianNKT" 
                            value="ya" 
                            checked={estateForm.melakukanPenilaianNKT === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, melakukanPenilaianNKT: true }))}
                            data-testid="radio-nkt-ya" 
                          />
                          <Label htmlFor="nkt-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="nkt-tidak" 
                            name="melakukanPenilaianNKT" 
                            value="tidak" 
                            checked={estateForm.melakukanPenilaianNKT === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, melakukanPenilaianNKT: false }))}
                            data-testid="radio-nkt-tidak" 
                          />
                          <Label htmlFor="nkt-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Apakah Perusahaan menyampaikan Laporan Pengelolaan Area Bernilai Konservasi Tinggi Ke Instansi Terkait ?</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="laporan-nkt-ya" 
                            name="menyampaikanLaporanNKT" 
                            value="ya" 
                            checked={estateForm.menyampaikanLaporanNKT === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, menyampaikanLaporanNKT: true }))}
                            data-testid="radio-laporan-nkt-ya" 
                          />
                          <Label htmlFor="laporan-nkt-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="laporan-nkt-tidak" 
                            name="menyampaikanLaporanNKT" 
                            value="tidak" 
                            checked={estateForm.menyampaikanLaporanNKT === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, menyampaikanLaporanNKT: false }))}
                            data-testid="radio-laporan-nkt-tidak" 
                          />
                          <Label htmlFor="laporan-nkt-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Apakah Anda melakukan Penilaian SKT?</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="skt-ya" 
                            name="melakukanPenilaianSKT" 
                            value="ya" 
                            checked={estateForm.melakukanPenilaianSKT === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, melakukanPenilaianSKT: true }))}
                            data-testid="radio-skt-ya" 
                          />
                          <Label htmlFor="skt-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="skt-tidak" 
                            name="melakukanPenilaianSKT" 
                            value="tidak" 
                            checked={estateForm.melakukanPenilaianSKT === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, melakukanPenilaianSKT: false }))}
                            data-testid="radio-skt-tidak" 
                          />
                          <Label htmlFor="skt-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-penilaian">Keterangan :</Label>
                      <Textarea 
                        id="keterangan-penilaian" 
                        placeholder="Keterangan penilaian" 
                        value={estateForm.keteranganPenilaian || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganPenilaian: e.target.value }))}
                        data-testid="textarea-keterangan-penilaian" 
                      />
                    </div>
                  </div>
                </div>

                {/* 2.5 Area Gambut */}
                <div className="space-y-4">
                  <h4 className="font-medium">2.5 Apakah Penanaman dilakukan di area gambut?</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="gambut-ya" 
                            name="penanamanDiAreaGambut" 
                            value="ya" 
                            checked={estateForm.penanamanDiAreaGambut === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, penanamanDiAreaGambut: true }))}
                            data-testid="radio-gambut-ya" 
                          />
                          <Label htmlFor="gambut-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="gambut-tidak" 
                            name="penanamanDiAreaGambut" 
                            value="tidak" 
                            checked={estateForm.penanamanDiAreaGambut === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, penanamanDiAreaGambut: false }))}
                            data-testid="radio-gambut-tidak" 
                          />
                          <Label htmlFor="gambut-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-gambut">Keterangan :</Label>
                      <Textarea 
                        id="keterangan-gambut" 
                        placeholder="Keterangan area gambut" 
                        value={estateForm.keteranganAreaGambut || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganAreaGambut: e.target.value }))}
                        data-testid="textarea-keterangan-gambut" 
                      />
                    </div>

                    {estateForm.penanamanDiAreaGambut && (
                      <div className="space-y-2">
                        <Label htmlFor="luas-tahun-gambut">Jika Ya, Sebutkan Luasnya dan Tahun Pembukaanya :</Label>
                        <div className="flex gap-4 items-center">
                          <Input 
                            id="luas-gambut" 
                            type="number" 
                            placeholder="Luas (Ha)" 
                            className="w-32"
                            value={estateForm.luasAreaGambut || ""}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, luasAreaGambut: Number(e.target.value) }))}
                            data-testid="input-luas-gambut" 
                          />
                          <span>Ha</span>
                          <Input 
                            id="tahun-gambut" 
                            type="number" 
                            placeholder="Tahun pembukaan" 
                            className="w-32"
                            value={estateForm.tahunPembukaanGambut || ""}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, tahunPembukaanGambut: Number(e.target.value) }))}
                            data-testid="input-tahun-gambut" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2.6 SK Titik Penaatan */}
                <div className="space-y-4">
                  <h4 className="font-medium">2.6 Apakah Perusahaan Memiliki SK Titik Penaatan Pemulihan Fungsi Hidrologis Gambut yang ditetapkan KLHK</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="sk-penaatan-ya" 
                            name="memilikiSKTitikPenaatan" 
                            value="ya" 
                            checked={estateForm.memilikiSKTitikPenaatan === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiSKTitikPenaatan: true }))}
                            data-testid="radio-sk-penaatan-ya" 
                          />
                          <Label htmlFor="sk-penaatan-ya">Ya</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="sk-penaatan-tidak" 
                            name="memilikiSKTitikPenaatan" 
                            value="tidak" 
                            checked={estateForm.memilikiSKTitikPenaatan === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, memilikiSKTitikPenaatan: false }))}
                            data-testid="radio-sk-penaatan-tidak" 
                          />
                          <Label htmlFor="sk-penaatan-tidak">Tidak</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-sk-penaatan">Keterangan : ( Diisi Jika ada penanaman di lahan gambut)</Label>
                      <Textarea 
                        id="keterangan-sk-penaatan" 
                        placeholder="Keterangan SK Titik Penaatan" 
                        value={estateForm.keteranganSKTitikPenaatan || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganSKTitikPenaatan: e.target.value }))}
                        data-testid="textarea-keterangan-sk-penaatan" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dokumen-sk-penaatan">Lampirkan Dokumen :</Label>
                      <Input 
                        id="dokumen-sk-penaatan" 
                        placeholder="Link dokumen SK Titik Penaatan" 
                        value={estateForm.dokumenSKTitikPenaatan || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, dokumenSKTitikPenaatan: e.target.value }))}
                        data-testid="input-dokumen-sk-penaatan" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={createEstateDataMutation.isPending}
                  data-testid="button-save-draft"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Draft
                </Button>
                <Button 
                  onClick={handleSubmitEstateForm}
                  disabled={createEstateDataMutation.isPending}
                  data-testid="button-submit-estate-form"
                >
                  {createEstateDataMutation.isPending ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Kirim Formulir
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab - Placeholder */}
        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dokumentasi Upload</CardTitle>
              <p className="text-sm text-gray-600">Upload dokumen yang diperlukan untuk kepatuhan EUDR</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fungsi upload dokumentasi akan ditambahkan di sini</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Tab - Placeholder */}
        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Penilaian Kepatuhan</CardTitle>
              <p className="text-sm text-gray-600">Penilaian dan validasi data yang telah disubmit</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Fungsi penilaian akan ditambahkan di sini</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}