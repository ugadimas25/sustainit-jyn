import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Upload, Download, Eye } from 'lucide-react';
import type { UploadResult } from '@uppy/core';


export default function LegalityCompliance() {
  const [activeTab, setActiveTab] = useState('supplier-compliance');
  const { toast } = useToast();

  const [supplierComplianceForm, setSupplierComplianceForm] = useState({
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '',
    aktaPerubahan: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    alamatKantor: '',
    alamatKebun: '',
    koordinatKebun: '',
    koordinatKantor: '',
    jenisSupplier: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    // Legal Compliance sections
    historisPerolehanTanah: false,
    historisKeterangan: '',
    izinPencadanganLahan: false,
    izinPencadanganKeterangan: '',
    persetujuanPKKPR: false,
    persetujuanPKKPRKeterangan: '',
    izinUsahaPerkebunan: false,
    izinUsahaPerkebunanKeterangan: '',
    skHGU: false,
    skHGUKeterangan: '',
    sertifikatHGU: false,
    sertifikatHGUKeterangan: '',
    laporanPemanfaatanHGU: false,
    laporanPemanfaatanHGUKeterangan: '',
    laporanLPUP: false,
    laporanLPUPKeterangan: '',
    izinLingkungan: false,
    izinLingkunganKeterangan: '',
    izinRintekTPS: false,
    izinRintekTPSKeterangan: '',
    izinPertekLimbah: false,
    izinPertekLimbahKeterangan: '',
    persetujuanAndalalin: false,
    persetujuanAndalalinKeterangan: '',
  });

  const createSupplierComplianceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supplier-compliance', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-compliance'] });
      toast({
        title: "Data Supplier Compliance berhasil disimpan",
        description: "Data Kepatuhan Hukum Supplier telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan data",
        description: error.message || "Terjadi kesalahan saat menyimpan data supplier compliance.",
        variant: "destructive",
      });
    },
  });

  const handleSupplierComplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierComplianceMutation.mutate(supplierComplianceForm);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects${uploadURL.split('/uploads')[1]}` : uploadURL;
      
      setSupplierComplianceForm(prev => ({ ...prev, [fieldName]: objectPath }));
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen untuk ${fieldName} telah berhasil diunggah.`,
      });
    }
  };

  // Dummy data for results table
  const dummySupplierComplianceData = [
    {
      id: 1,
      namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
      tingkatKepatuhan: 85,
      statusKepatuhan: 'Compliant',
      tanggalPenilaian: '15 November 2024',
      nomorTelefonTimInternal: '+62 811-2345-6789',
      emailKontak: 'compliance@kebun-sejahtera.co.id'
    },
    {
      id: 2,
      namaSupplier: 'CV Perkebunan Nusantara',
      tingkatKepatuhan: 92,
      statusKepatuhan: 'Highly Compliant',
      tanggalPenilaian: '18 November 2024',
      nomorTelefonTimInternal: '+62 812-3456-7890',
      emailKontak: 'legal@perkebunan-nusantara.co.id'
    },
    {
      id: 3,
      namaSupplier: 'Koperasi Tani Mandiri',
      tingkatKepatuhan: 68,
      statusKepatuhan: 'Partially Compliant',
      tanggalPenilaian: '20 November 2024',
      nomorTeleponTimInternal: '+62 813-4567-8901',
      emailKontak: 'koperasi@tani-mandiri.co.id'
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legality Compliance</h1>
          <p className="text-gray-600">
            Sistem penilaian kepatuhan hukum supplier untuk memastikan compliance dengan regulasi EUDR
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplier-compliance" data-testid="tab-supplier-compliance">Supplier Compliance</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Hasil Penilaian</TabsTrigger>
          </TabsList>

          {/* Supplier Compliance Tab */}
          <TabsContent value="supplier-compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulir Informasi Kepatuhan Hukum</CardTitle>
                <CardDescription>
                  (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupplierComplianceSubmit} className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar Supplier</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="namaSupplierCompliance">Nama Supplier</Label>
                        <Input
                          id="namaSupplierCompliance"
                          data-testid="input-nama-supplier-compliance"
                          value={supplierComplianceForm.namaSupplier}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                          placeholder="Masukkan nama supplier"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="namaGroupCompliance">Nama Group</Label>
                        <Input
                          id="namaGroupCompliance"
                          data-testid="input-nama-group-compliance"
                          value={supplierComplianceForm.namaGroup}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                          placeholder="Masukkan nama group"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="alamatKantorCompliance">Alamat Kantor</Label>
                        <Textarea
                          id="alamatKantorCompliance"
                          value={supplierComplianceForm.alamatKantor}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                          placeholder="Masukkan alamat lengkap kantor"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alamatKebunCompliance">Alamat Kebun</Label>
                        <Textarea
                          id="alamatKebunCompliance"
                          value={supplierComplianceForm.alamatKebun}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                          placeholder="Masukkan alamat lengkap kebun"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Legal Compliance Sections */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Kepatuhan Hukum</h3>
                    
                    {/* Section 3.1 - Historis Perolehan Tanah */}
                    <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                      <Label className="text-base font-semibold">3.1 Historis Perolehan Tanah</Label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="historisPerolehanTanah"
                            checked={supplierComplianceForm.historisPerolehanTanah}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ 
                              ...prev, 
                              historisPerolehanTanah: e.target.checked 
                            }))}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="historisPerolehanTanah">
                            Apakah terdapat historis perolehan tanah secara legal?
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan Tambahan</Label>
                          <Textarea
                            value={supplierComplianceForm.historisKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ 
                              ...prev, 
                              historisKeterangan: e.target.value 
                            }))}
                            placeholder="Berikan keterangan detail mengenai historis perolehan tanah"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lampirkan Dokumen: (dalam Bentuk Google Drive)</Label>
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenHistoris')}
                          >
                            <span>📁 Unggah Dokumen Historis</span>
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    {/* Section 3.2 - Izin Pencadangan Lahan */}
                    <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                      <Label className="text-base font-semibold">3.2 Izin Pencadangan Lahan</Label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="izinPencadanganLahan"
                            checked={supplierComplianceForm.izinPencadanganLahan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ 
                              ...prev, 
                              izinPencadanganLahan: e.target.checked 
                            }))}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="izinPencadanganLahan">
                            Apakah memiliki izin pencadangan lahan yang valid?
                          </Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan Izin</Label>
                          <Textarea
                            value={supplierComplianceForm.izinPencadanganKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ 
                              ...prev, 
                              izinPencadanganKeterangan: e.target.value 
                            }))}
                            placeholder="Berikan detail mengenai izin pencadangan lahan"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    data-testid="button-submit-supplier-compliance"
                    className="w-full" 
                    disabled={createSupplierComplianceMutation.isPending}
                  >
                    {createSupplierComplianceMutation.isPending ? 'Menyimpan...' : 'Simpan Data Supplier Compliance'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hasil Penilaian Kepatuhan Supplier</CardTitle>
                <CardDescription>
                  Daftar supplier yang telah dinilai tingkat kepatuhannya terhadap regulasi hukum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead>Tingkat Kepatuhan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Penilaian</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dummySupplierComplianceData.map((compliance) => (
                        <TableRow key={compliance.id}>
                          <TableCell className="font-medium">{compliance.namaSupplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    compliance.tingkatKepatuhan >= 90 ? 'bg-green-500' : 
                                    compliance.tingkatKepatuhan >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${compliance.tingkatKepatuhan}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{compliance.tingkatKepatuhan}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={compliance.tingkatKepatuhan >= 90 ? 'default' : compliance.tingkatKepatuhan >= 75 ? 'secondary' : 'destructive'}>
                              {compliance.statusKepatuhan}
                            </Badge>
                          </TableCell>
                          <TableCell>{compliance.tanggalPenilaian}</TableCell>
                          <TableCell className="text-sm">
                            <div>{compliance.nomorTelefonTimInternal}</div>
                            <div className="text-muted-foreground">{compliance.emailKontak}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}